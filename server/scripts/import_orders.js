const { connect, getClient } = require('../lib/mongoClient');

async function run() {
  try {
    const db = await connect();

    const sampleOrders = [
      {
        userId: null,
        userEmail: 'test@example.com',
        userName: 'Test Customer',
        status: 'ready',
        paymentStatus: 'unpaid',
        paymentMethod: 'cod',
        total: 450,
        items: [
          { name: 'Birthday Cake', price: 300, quantity: 1 },
          { name: 'Candles', price: 50, quantity: 1 },
          { name: 'Party Hats', price: 100, quantity: 1 }
        ],
        contact: {
          name: 'Test Customer',
          phone: '9876543210',
          email: 'test@example.com',
          flatNo: 'A-101',
          area: 'Sector 15',
          district: 'Gurgaon',
          pincode: '122001',
          landmark: 'Near Metro Station',
          addressType: 'home'
        },
        createdAt: new Date(),
        statusHistory: [
          { status: 'received', by: 'system', at: new Date() },
          { status: 'confirmed', by: 'admin', at: new Date() },
          { status: 'processing', by: 'admin', at: new Date() },
          { status: 'ready', by: 'admin', at: new Date() }
        ]
      },
      {
        userId: null,
        userEmail: 'customer@example.com',
        userName: 'Another Customer',
        status: 'out_for_delivery',
        paymentStatus: 'paid',
        paymentMethod: 'online',
        total: 750,
        items: [
          { name: 'Anniversary Cake', price: 500, quantity: 1 },
          { name: 'Chocolate Box', price: 250, quantity: 1 }
        ],
        contact: {
          name: 'Another Customer',
          phone: '9123456789',
          email: 'customer@example.com',
          flatNo: 'B-202',
          area: 'DLF Phase 1',
          district: 'Gurgaon',
          pincode: '122002',
          landmark: 'Opposite Mall',
          addressType: 'home'
        },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        statusHistory: [
          { status: 'received', by: 'system', at: new Date(Date.now() - 3600000) },
          { status: 'confirmed', by: 'admin', at: new Date(Date.now() - 3000000) },
          { status: 'processing', by: 'admin', at: new Date(Date.now() - 2400000) },
          { status: 'ready', by: 'admin', at: new Date(Date.now() - 1800000) },
          { status: 'out_for_delivery', by: 'delivery', at: new Date(Date.now() - 900000) }
        ]
      },
      {
        userId: null,
        userEmail: 'user@example.com',
        userName: 'Regular User',
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'cod',
        total: 200,
        items: [
          { name: 'Small Cake', price: 200, quantity: 1 }
        ],
        contact: {
          name: 'Regular User',
          phone: '8765432109',
          email: 'user@example.com',
          flatNo: 'C-303',
          area: 'MG Road',
          district: 'Gurgaon',
          pincode: '122003',
          landmark: 'Near Bank',
          addressType: 'office'
        },
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        statusHistory: [
          { status: 'received', by: 'system', at: new Date(Date.now() - 7200000) },
          { status: 'confirmed', by: 'admin', at: new Date(Date.now() - 6600000) },
          { status: 'processing', by: 'admin', at: new Date(Date.now() - 6000000) },
          { status: 'ready', by: 'admin', at: new Date(Date.now() - 5400000) },
          { status: 'out_for_delivery', by: 'delivery', at: new Date(Date.now() - 4800000) },
          { status: 'delivered', by: 'delivery', at: new Date(Date.now() - 3600000) }
        ]
      }
    ];

    let inserted = 0;
    for (const order of sampleOrders) {
      try {
        await db.collection('orders').insertOne(order);
        inserted++;
        console.log(`Inserted order for ${order.userName}`);
      } catch (e) {
        console.warn('Could not insert order', e && e.message);
      }
    }

    console.log(`Successfully inserted ${inserted} sample orders`);
    if (getClient()) await getClient().close();
    process.exit(0);
  } catch (err) {
    console.error('Import failed', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();