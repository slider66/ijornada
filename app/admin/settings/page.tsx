"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSystemConfig, updateSystemConfig, upsertAdminUser } from "./actions";
import { getCompanyInfo, updateCompanyInfo, type CompanyInfoData } from "./company-actions";
import { toast } from "sonner";
import { Calendar, Trash2, AlertTriangle, Shield, Building2, X } from "lucide-react";
import { resetData } from "@/app/admin/exports/actions";
import Image from "next/image";

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Reset Config
  const [resetAll, setResetAll] = useState(false);
  const [resetFrom, setResetFrom] = useState("");
  const [resetTo, setResetTo] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await getSystemConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async (key: string, value: string) => {
    const result = await updateSystemConfig(key, value);
    if (result.success) {
      toast.success("Configuración guardada");
      setConfig((prev) => ({ ...prev, [key]: value }));
    } else {
      toast.error("Error al guardar");
    }
  };

  const handleReset = async () => {
    let message = "¿Estás seguro?\\n";
    if (resetAll) {
      message += "ESTO BORRARÁ TODO EL HISTORIAL DE FICHAJES E INCIDENCIAS.\\n";
    } else {
      if (!resetFrom || !resetTo) {
        toast.error("Selecciona un rango de fechas o marca 'Borrar Todo'");
        return;
      }
      message += `Se borrarán los datos desde ${resetFrom} hasta ${resetTo}.\\n`;
    }
    message += "Esta acción no se puede deshacer.";

    if (confirm(message)) {
      setLoading(true);
      const from = resetAll ? undefined : new Date(resetFrom);
      const to = resetAll ? undefined : new Date(resetTo);
      // Adjust to include the full end day
      if (to) to.setHours(23, 59, 59, 999);

      const result = await resetData(from, to);
      if (result.success) {
        toast.success("Datos eliminados correctamente");
        if (resetAll) {
          setResetFrom("");
          setResetTo("");
        }
      } else {
        toast.error("Error al reiniciar datos");
      }
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración del Sistema</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Fechas del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="pilot-date">Fecha Inicio Piloto</Label>
              <div className="flex gap-2">
                <Input
                  id="pilot-date"
                  type="date"
                  value={config["PILOT_START_DATE"] || ""}
                  onChange={(e) => setConfig({ ...config, "PILOT_START_DATE": e.target.value })}
                />
                <Button onClick={() => handleSave("PILOT_START_DATE", config["PILOT_START_DATE"])}>
                  Guardar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Los datos anteriores a esta fecha serán ignorados en las estadísticas si no hay fecha de producción definida.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prod-date">Fecha Inicio Producción</Label>
              <div className="flex gap-2">
                <Input
                  id="prod-date"
                  type="date"
                  value={config["PRODUCTION_START_DATE"] || ""}
                  onChange={(e) => setConfig({ ...config, "PRODUCTION_START_DATE": e.target.value })}
                />
                <Button onClick={() => handleSave("PRODUCTION_START_DATE", config["PRODUCTION_START_DATE"])}>
                  Guardar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Si se define, esta fecha tiene prioridad sobre la fecha piloto. Los datos anteriores serán ignorados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Datos de la Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyInfoForm />
        </CardContent>
      </Card>

      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Administrador del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminUserForm />
          </CardContent>
        </Card>
      </div>

      <div className="max-w-xl">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" /> Zona de Peligro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-red-600">
                Selecciona el rango de fechas que deseas limpiar (por ejemplo pruebas antiguas).
              </p>

              <div className="grid gap-2 p-3 border border-red-100 rounded bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="reset-all"
                    checked={resetAll}
                    onChange={(e) => setResetAll(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <Label htmlFor="reset-all" className="cursor-pointer font-medium text-red-900">Borrar TODO el historial (Peligro)</Label>
                </div>

                {!resetAll && (
                  <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-1.5">
                      <Label htmlFor="reset-from" className="text-xs">Desde</Label>
                      <Input
                        id="reset-from"
                        type="date"
                        value={resetFrom}
                        onChange={(e) => setResetFrom(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="reset-to" className="text-xs">Hasta</Label>
                      <Input
                        id="reset-to"
                        type="date"
                        value={resetTo}
                        onChange={(e) => setResetTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="destructive" onClick={handleReset} disabled={loading}>
                  <Trash2 className="mr-2 h-4 w-4" /> {resetAll ? "Borrar Todo" : "Borrar Rango"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast.error("Rellena todos los campos");
      return;
    }

    setLoading(true);
    const res = await upsertAdminUser({ name, email, password });
    setLoading(false);

    if (res.success) {
      toast.success("Administrador guardado correctamente");
      setPassword(""); // Clear password for security
    } else {
      toast.error("Error al guardar administrador");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Administrador General" />
      </div>
      <div className="grid gap-2">
        <Label>Email (Para recuperación)</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.com" />
        <p className="text-xs text-muted-foreground">Este email será necesario para recuperar la contraseña.</p>
      </div>
      <div className="grid gap-2">
        <Label>Contraseña</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />
      </div>
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Guardando..." : "Crear / Actualizar Admin"}
      </Button>
    </div>
  );
}

function CompanyInfoForm() {
  const [companyData, setCompanyData] = useState<CompanyInfoData>({
    name: "",
    cif: "",
    address: "",
    postalCode: "",
    city: "",
    phone: "",
    email: "",
    logoPath: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    const data = await getCompanyInfo();
    if (data) {
      setCompanyData(data);
      setLogoPreview(data.logoPath || "");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setCompanyData({ ...companyData, logoPath: result.path });
        setLogoPreview(result.path);
        toast.success("Logo subido correctamente");
      } else {
        toast.error(result.error || "Error al subir logo");
      }
    } catch (error) {
      toast.error("Error al subir logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setCompanyData({ ...companyData, logoPath: "" });
    setLogoPreview("");
  };

  const handleSubmit = async () => {
    if (!companyData.name) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    setLoading(true);
    const result = await updateCompanyInfo(companyData);
    setLoading(false);

    if (result.success) {
      toast.success("Datos de empresa guardados correctamente");
    } else {
      toast.error("Error al guardar datos de empresa");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Nombre de la Empresa *</Label>
          <Input
            value={companyData.name}
            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
            placeholder="Ej: Mi Empresa S.L."
          />
        </div>
        <div className="grid gap-2">
          <Label>CIF/NIF</Label>
          <Input
            value={companyData.cif || ""}
            onChange={(e) => setCompanyData({ ...companyData, cif: e.target.value })}
            placeholder="Ej: B12345678"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Dirección</Label>
        <Input
          value={companyData.address || ""}
          onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
          placeholder="Ej: Calle Principal 123"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Código Postal</Label>
          <Input
            value={companyData.postalCode || ""}
            onChange={(e) => setCompanyData({ ...companyData, postalCode: e.target.value })}
            placeholder="Ej: 28001"
          />
        </div>
        <div className="grid gap-2">
          <Label>Ciudad</Label>
          <Input
            value={companyData.city || ""}
            onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
            placeholder="Ej: Madrid"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Teléfono</Label>
          <Input
            value={companyData.phone || ""}
            onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
            placeholder="Ej: +34 912 345 678"
          />
        </div>
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={companyData.email || ""}
            onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
            placeholder="Ej: info@empresa.com"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Logo de la Empresa</Label>
        <div className="flex items-start gap-4">
          {logoPreview && (
            <div className="relative">
              <Image
                src={logoPreview}
                alt="Logo de empresa"
                width={100}
                height={100}
                className="border rounded object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos: PNG, JPG, JPEG, SVG. Tamaño máximo: 2MB
            </p>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading || uploading} className="w-full">
        {loading ? "Guardando..." : "Guardar Datos de Empresa"}
      </Button>
    </div>
  );
}
