export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Trabajadores Activos</h3>
          <p className="text-4xl font-bold text-blue-600">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Fichajes Hoy</h3>
          <p className="text-4xl font-bold text-green-600">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Incidencias Pendientes</h3>
          <p className="text-4xl font-bold text-orange-600">--</p>
        </div>
      </div>
    </div>
  )
}
