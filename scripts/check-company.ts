import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCompanyInfo() {
    console.log('Verificando datos de empresa en base de datos...\n')

    try {
        const companyInfo = await prisma.companyInfo.findMany()

        if (companyInfo.length === 0) {
            console.log('❌ NO hay datos de empresa guardados')
            console.log('\nPara agregar datos de empresa:')
            console.log('1. Ve a http://localhost:3000/admin/settings')
            console.log('2. Completa el formulario "Datos de la Empresa"')
            console.log('3. Sube el logo (opcional)')
            console.log('4. Haz clic en "Guardar Datos de Empresa"')
        } else {
            console.log('✅ Datos de empresa encontrados:\n')
            companyInfo.forEach((company, index) => {
                console.log(`Registro ${index + 1}:`)
                console.log(`  Nombre: ${company.name || '(vacío)'}`)
                console.log(`  CIF: ${company.cif || '(vacío)'}`)
                console.log(`  Dirección: ${company.address || '(vacío)'}`)
                console.log(`  Código Postal: ${company.postalCode || '(vacío)'}`)
                console.log(`  Ciudad: ${company.city || '(vacío)'}`)
                console.log(`  Teléfono: ${company.phone || '(vacío)'}`)
                console.log(`  Email: ${company.email || '(vacío)'}`)
                console.log(`  Logo: ${company.logoPath || '(sin logo)'}`)
                console.log(`  Creado: ${company.createdAt}`)
                console.log(`  Actualizado: ${company.updatedAt}`)
                console.log('')
            })
        }

        await prisma.$disconnect()
    } catch (error) {
        console.error('Error al verificar datos de empresa:', error)
        await prisma.$disconnect()
        process.exit(1)
    }
}

checkCompanyInfo()
