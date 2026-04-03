import { prisma } from '../utils/db';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create a test user with ADMIN role
    const hashedPassword = await bcrypt.hash('Test@1234', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@equiledger.com' },
        update: {},
        create: {
            email: 'admin@equiledger.com',
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });

    console.log(`✅ User created: ${user.email} (ID: ${user.id})`);

    // 2. Delete existing records for this user (clean slate)
    await prisma.record.deleteMany({ where: { userId: user.id } });
    console.log('🗑️  Cleared old records');

    // 3. Create diverse records across multiple months and categories
    const now = new Date();
    const records = [
        // --- Current month ---
        { amount: 5000.00, type: 'INCOME'  as const, category: 'Salary',        date: new Date(now.getFullYear(), now.getMonth(), 1),  description: 'Monthly salary' },
        { amount: 1200.00, type: 'EXPENSE' as const, category: 'Rent',          date: new Date(now.getFullYear(), now.getMonth(), 3),  description: 'Apartment rent' },
        { amount: 250.00,  type: 'EXPENSE' as const, category: 'Groceries',     date: new Date(now.getFullYear(), now.getMonth(), 5),  description: 'Weekly grocery shopping' },
        { amount: 80.00,   type: 'EXPENSE' as const, category: 'Transport',     date: new Date(now.getFullYear(), now.getMonth(), 7),  description: 'Fuel' },
        { amount: 500.00,  type: 'INCOME'  as const, category: 'Freelance',     date: new Date(now.getFullYear(), now.getMonth(), 10), description: 'Logo design project' },

        // --- Last month ---
        { amount: 5000.00, type: 'INCOME'  as const, category: 'Salary',        date: new Date(now.getFullYear(), now.getMonth() - 1, 1),  description: 'Monthly salary' },
        { amount: 1200.00, type: 'EXPENSE' as const, category: 'Rent',          date: new Date(now.getFullYear(), now.getMonth() - 1, 3),  description: 'Apartment rent' },
        { amount: 300.00,  type: 'EXPENSE' as const, category: 'Groceries',     date: new Date(now.getFullYear(), now.getMonth() - 1, 8),  description: 'Grocery run' },
        { amount: 150.00,  type: 'EXPENSE' as const, category: 'Entertainment', date: new Date(now.getFullYear(), now.getMonth() - 1, 15), description: 'Concert tickets' },

        // --- 2 months ago ---
        { amount: 5000.00, type: 'INCOME'  as const, category: 'Salary',        date: new Date(now.getFullYear(), now.getMonth() - 2, 1),  description: 'Monthly salary' },
        { amount: 1200.00, type: 'EXPENSE' as const, category: 'Rent',          date: new Date(now.getFullYear(), now.getMonth() - 2, 3),  description: 'Apartment rent' },
        { amount: 400.00,  type: 'EXPENSE' as const, category: 'Utilities',     date: new Date(now.getFullYear(), now.getMonth() - 2, 10), description: 'Electricity + internet' },
        { amount: 2000.00, type: 'INCOME'  as const, category: 'Freelance',     date: new Date(now.getFullYear(), now.getMonth() - 2, 20), description: 'Website project' },

        // --- 3 months ago ---
        { amount: 5000.00, type: 'INCOME'  as const, category: 'Salary',        date: new Date(now.getFullYear(), now.getMonth() - 3, 1),  description: 'Monthly salary' },
        { amount: 1200.00, type: 'EXPENSE' as const, category: 'Rent',          date: new Date(now.getFullYear(), now.getMonth() - 3, 3),  description: 'Apartment rent' },
        { amount: 600.00,  type: 'EXPENSE' as const, category: 'Shopping',      date: new Date(now.getFullYear(), now.getMonth() - 3, 12), description: 'New clothes' },
    ];

    for (const record of records) {
        await prisma.record.create({
            data: {
                ...record,
                userId: user.id,
            },
        });
    }

    console.log(`✅ Created ${records.length} records`);
    console.log('\n📊 Seed Summary:');
    console.log(`   User:     admin@equiledger.com / Test@1234`);
    console.log(`   Role:     ADMIN`);
    console.log(`   Records:  ${records.length} across 4 months`);
    console.log('\n🎉 Seeding complete!');

    process.exit(0);
}

seed().catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
