const { connect, getClient } = require('../lib/mongoClient');

async function run() {
    try {
        const db = await connect();
        const collection = db.collection('products');

        const kits = [

            /* ===========================
               🎂 BIRTHDAY KITS (4 Tiers)
            =========================== */

            {
                id: 'birthday-basic',
                name: 'Birthday Basic Kit',
                category: 'birthday',
                tier: 'basic',
                price: 999,
                originalPrice: 1099,
                image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd2?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Paper plates – 50 pcs',
                    'Balloons – 2 packets',
                    'Happy Birthday balloon banner – 1',
                    'Cake topper – 1',
                    'Candles – 1 pack',
                    'Birthday cap – 1',
                    'Party popper / confetti stick – 1–2',
                    'Double-side tape – 1 roll'
                ]
            },

            {
                id: 'birthday-premium',
                name: 'Birthday Premium Kit',
                category: 'birthday',
                tier: 'premium',
                price: 1799,
                originalPrice: 1999,
                image: 'https://images.pexels.com/photos/3529497/pexels-photo-3529497.jpeg?auto=compress&cs=tinysrgb&w=800',
                items: [
                    'Paper plates – 50 pcs',
                    'Balloons – 3 packets',
                    'Happy Birthday balloon banner – 1',
                    'Cake topper (premium) – 1',
                    'Candles – 1 pack',
                    'Birthday caps – 5',
                    'Party poppers – 3',
                    'LED fairy lights – 1 set',
                    'Photo props – 6 pcs',
                    'Double-side tape – 2 rolls'
                ]
            },

            {
                id: 'birthday-gold',
                name: 'Birthday Gold Kit',
                category: 'birthday',
                tier: 'gold',
                price: 2999,
                originalPrice: 3299,
                image: 'https://images.unsplash.com/photo-1562887084-bd9b9ef9343a?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Paper plates – 50 pcs',
                    'Balloons – 4 packets',
                    'Foil number balloons – 1 set',
                    'Semi balloon arch kit – 1',
                    'LED fairy lights – 2 sets',
                    'Photo props – 10+ pcs',
                    'Birthday caps – 5',
                    'Party poppers – 4',
                    'Double-side tape – 3 rolls'
                ]
            },

            {
                id: 'birthday-platinum',
                name: 'Birthday Platinum Kit',
                category: 'birthday',
                tier: 'platinum',
                price: 5499,
                originalPrice: 5999,
                image: 'https://images.unsplash.com/photo-1582719478183-9f427e83091a?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Paper plates – 50 pcs',
                    'Premium balloons – 5+ packets',
                    'Full balloon arch with stand',
                    'LED fairy lights – 3–4 sets',
                    'Photo props – 15 pcs',
                    'Premium confetti cannon',
                    'Table + wall décor',
                    'Double-side tape – 4 rolls'
                ]
            },

            /* ===========================
               💍 ANNIVERSARY KITS (4 Tiers)
            =========================== */

            {
                id: 'anniversary-basic',
                name: 'Anniversary Basic Kit',
                category: 'anniversary',
                tier: 'basic',
                price: 999,
                originalPrice: 1099,
                image: 'https://images.unsplash.com/photo-1518546305928-8a68f7dfee12?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Heart balloons – 2 packets',
                    'Happy Anniversary banner – 1',
                    'LED candles – 1 set',
                    'Rose petals (artificial) – 1 pack',
                    'Double-side tape – 1 roll'
                ]
            },

            {
                id: 'anniversary-premium',
                name: 'Anniversary Premium Kit',
                category: 'anniversary',
                tier: 'premium',
                price: 1799,
                originalPrice: 1999,
                image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Heart balloons – 3 packets',
                    'Happy Anniversary banner – 1',
                    'LED fairy lights – 1 set',
                    'Photo props – 6 pcs',
                    'Table décor items',
                    'Double-side tape – 2 rolls'
                ]
            },

            {
                id: 'anniversary-gold',
                name: 'Anniversary Gold Kit',
                category: 'anniversary',
                tier: 'gold',
                price: 2999,
                originalPrice: 3299,
                image: 'https://images.unsplash.com/photo-1529122310307-4d52e7d580b6?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Heart balloons – 4 packets',
                    'Semi balloon arch – 1',
                    'Foil heart balloons – 1 set',
                    'LED fairy lights – 2 sets',
                    'Table décor set',
                    'Double-side tape – 3 rolls'
                ]
            },

            {
                id: 'anniversary-platinum',
                name: 'Anniversary Platinum Kit',
                category: 'anniversary',
                tier: 'platinum',
                price: 5499,
                originalPrice: 5999,
                image: 'https://images.unsplash.com/photo-1516375195440-dea12b3406cd?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Heart balloons – 5+ packets',
                    'Full balloon arch',
                    'Premium LED lights',
                    'Luxury décor set',
                    'Premium confetti cannon',
                    'Double-side tape – 4 rolls'
                ]
            },

            /* ===========================
               🎉 PARTY KITS (4 Tiers)
            =========================== */

            {
                id: 'party-basic',
                name: 'Party Basic Kit',
                category: 'party',
                tier: 'basic',
                price: 999,
                originalPrice: 1099,
                image: 'https://images.unsplash.com/photo-1560249502-34fbf4e4a3fb?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 2 packets',
                    'Party banner – 1',
                    'LED lights – 1 set',
                    'Party poppers – 2',
                    'Double-side tape – 1 roll'
                ]
            },

            {
                id: 'party-premium',
                name: 'Party Premium Kit',
                category: 'party',
                tier: 'premium',
                price: 1799,
                originalPrice: 1999,
                image: 'https://images.unsplash.com/photo-1554234717-ff21018cd1e9?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 3 packets',
                    'Party banner – 1',
                    'LED lights – 2 sets',
                    'Photo props – 6 pcs',
                    'Party poppers – 4',
                    'Double-side tape – 2 rolls'
                ]
            },

            {
                id: 'party-gold',
                name: 'Party Gold Kit',
                category: 'party',
                tier: 'gold',
                price: 2999,
                originalPrice: 3299,
                image: 'https://images.unsplash.com/photo-1558979158-65a1eaa08691?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 4 packets',
                    'Balloon arch kit',
                    'LED lights – 2 sets',
                    'Table décor',
                    'Party poppers – 5',
                    'Double-side tape – 3 rolls'
                ]
            },

            {
                id: 'party-platinum',
                name: 'Party Platinum Kit',
                category: 'party',
                tier: 'platinum',
                price: 5499,
                originalPrice: 5999,
                image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 5+ packets',
                    'Full décor setup',
                    'Premium lighting',
                    'Confetti cannon',
                    'Double-side tape – 4 rolls'
                ]
            },

            /* ===========================
               🎁 SURPRISE / PROPOSAL KITS (4 Tiers)
            =========================== */

            {
                id: 'surprise-basic',
                name: 'Surprise Basic Kit',
                category: 'surprise',
                tier: 'basic',
                price: 999,
                originalPrice: 1099,
                image: 'https://images.unsplash.com/photo-1603052874918-5bfee96adbbf?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 2 packets',
                    'LED candles – 1 set',
                    'Rose petals (artificial) – 1 pack',
                    'Party popper – 1',
                    'Double-side tape – 1 roll'
                ]
            },
            {
                id: 'surprise-premium',
                name: 'Surprise Premium Kit',
                category: 'surprise',
                tier: 'premium',
                price: 1799,
                originalPrice: 1999,
                image: 'https://images.unsplash.com/photo-1559923336-0ea66cb14f8b?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 3 packets',
                    'LED fairy lights – 1 set',
                    'Heart foil balloons – 1 set',
                    'Party poppers – 2',
                    'Double-side tape – 2 rolls'
                ]
            },
            {
                id: 'surprise-gold',
                name: 'Surprise Gold Kit',
                category: 'surprise',
                tier: 'gold',
                price: 2999,
                originalPrice: 3299,
                image: 'https://images.unsplash.com/photo-1540157549-3b758ef4a4d8?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 4 packets',
                    'Semi balloon arch',
                    'LED lights – 2 sets',
                    'Table décor',
                    'Party poppers – 3',
                    'Double-side tape – 3 rolls'
                ]
            },
            {
                id: 'surprise-platinum',
                name: 'Surprise Platinum Kit',
                category: 'surprise',
                tier: 'platinum',
                price: 5499,
                originalPrice: 5999,
                image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Balloons – 5+ packets',
                    'Full balloon arch',
                    'Premium décor set',
                    'Confetti cannon',
                    'Double-side tape – 4 rolls'
                ]
            },

            /* ===========================
               � GRAND OPENING KITS (4 Tiers)
            =========================== */

            {
                id: 'festival-basic',
                name: 'Puja Basic Kit',
                nameHi: 'पूजा बेसिक किट',
                category: 'festival',
                tier: 'basic',
                price: 999,
                originalPrice: 1099,
                image: 'https://images.unsplash.com/photo-1513149739851-50f01dfcbd39?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Puja thali & items',
                    'Incense sticks & diyas',
                    'Flower garlands',
                    'Puja cloth & decorations',
                    'Double-side tape – 1 roll'
                ]
            },

            {
                id: 'festival-premium',
                name: 'Puja Premium Kit',
                nameHi: 'पूजा प्रीमियम किट',
                category: 'festival',
                tier: 'premium',
                price: 1799,
                originalPrice: 1999,
                image: 'https://images.unsplash.com/photo-1508873699372-7ae4b46b3c61?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Complete puja setup',
                    'Brass puja items',
                    'Premium diyas & lamps',
                    'Flower arrangements',
                    'Double-side tape – 2 rolls'
                ]
            },

            {
                id: 'festival-gold',
                name: 'Puja Gold Kit',
                nameHi: 'पूजा गोल्ड किट',
                category: 'festival',
                tier: 'gold',
                price: 2999,
                originalPrice: 3299,
                image: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Luxury puja arrangements',
                    'Silver/brass puja items',
                    'LED diyas & lighting',
                    'Premium flower décor',
                    'Double-side tape – 3 rolls'
                ]
            },

            {
                id: 'festival-platinum',
                name: 'Puja Platinum Kit',
                nameHi: 'पूजा प्लैटिनम किट',
                category: 'festival',
                tier: 'platinum',
                price: 5499,
                originalPrice: 5999,
                image: 'https://images.unsplash.com/photo-1543968996-8db935a70bc1?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Complete temple setup',
                    'Gold plated puja items',
                    'Professional lighting',
                    'Exotic flowers & décor',
                    'Double-side tape – 4 rolls'
                ]
            },

            /* ===========================
               🏪 GRAND OPENING KITS (4 Tiers)
            =========================== */

            {
                id: 'grandopening-basic',
                name: 'Grand Opening Basic Kit',
                nameHi: 'ग्रैंड ओपनिंग बेसिक किट',
                category: 'grandopening',
                tier: 'basic',
                price: 1499,
                originalPrice: 1699,
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Grand opening banner',
                    'Balloons – 2 packets',
                    'Ribbon cutting set',
                    'Welcome sign',
                    'Double-side tape – 1 roll'
                ]
            },

            {
                id: 'grandopening-premium',
                name: 'Grand Opening Premium Kit',
                nameHi: 'ग्रैंड ओपनिंग प्रीमियम किट',
                category: 'grandopening',
                tier: 'premium',
                price: 2499,
                originalPrice: 2799,
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Grand opening banner & signage',
                    'Balloons – 3 packets',
                    'LED lights – 2 sets',
                    'Welcome mat & decorations',
                    'Double-side tape – 2 rolls'
                ]
            },

            {
                id: 'grandopening-gold',
                name: 'Grand Opening Gold Kit',
                nameHi: 'ग्रैंड ओपनिंग गोल्ड किट',
                category: 'grandopening',
                tier: 'gold',
                price: 3999,
                originalPrice: 4399,
                image: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Complete grand opening setup',
                    'Balloon arch & decorations',
                    'Premium LED lights',
                    'Professional signage',
                    'Double-side tape – 3 rolls'
                ]
            },

            {
                id: 'grandopening-platinum',
                name: 'Grand Opening Platinum Kit',
                nameHi: 'ग्रैंड ओपनिंग प्लैटिनम किट',
                category: 'grandopening',
                tier: 'platinum',
                price: 6999,
                originalPrice: 7499,
                image: 'https://images.unsplash.com/photo-1543968996-8db935a70bc1?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Luxury grand opening setup',
                    'Full balloon & décor arrangements',
                    'Professional lighting setup',
                    'Red carpet & premium signage',
                    'Double-side tape – 4 rolls'
                ]
            },

            /* ===========================
               👶 BABY SHOWER KITS (4 Tiers)
            =========================== */

            {
                id: 'babyshower-basic',
                name: 'Baby Shower Basic Kit',
                nameHi: 'बेबी शॉवर बेसिक किट',
                category: 'babyshower',
                tier: 'basic',
                price: 1299,
                originalPrice: 1499,
                image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Baby shower banner',
                    'Pink/blue balloons',
                    'Baby themed decorations',
                    'Welcome baby sign',
                    'Double-side tape – 1 roll'
                ]
            },

            {
                id: 'babyshower-premium',
                name: 'Baby Shower Premium Kit',
                nameHi: 'बेबी शॉवर प्रीमियम किट',
                category: 'babyshower',
                tier: 'premium',
                price: 2199,
                originalPrice: 2499,
                image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Baby shower banner & props',
                    'Themed balloons – 3 packets',
                    'LED fairy lights',
                    'Baby themed table décor',
                    'Double-side tape – 2 rolls'
                ]
            },

            {
                id: 'babyshower-gold',
                name: 'Baby Shower Gold Kit',
                nameHi: 'बेबी शॉवर गोल्ड किट',
                category: 'babyshower',
                tier: 'gold',
                price: 3499,
                originalPrice: 3799,
                image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Complete baby shower setup',
                    'Balloon arch & decorations',
                    'Premium baby themed items',
                    'Photo booth props',
                    'Double-side tape – 3 rolls'
                ]
            },

            {
                id: 'babyshower-platinum',
                name: 'Baby Shower Platinum Kit',
                nameHi: 'बेबी शॉवर प्लैटिनम किट',
                category: 'babyshower',
                tier: 'platinum',
                price: 5999,
                originalPrice: 6499,
                image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
                items: [
                    'Luxury baby shower setup',
                    'Full décor with premium themes',
                    'Professional lighting',
                    'Custom baby props & signage',
                    'Double-side tape – 4 rolls'
                ]
            }

        ];

        for (const kit of kits) {
            const exists = await collection.findOne({ id: kit.id });
            if (!exists) await collection.insertOne(kit);
        }

        console.log('✅ All kits inserted successfully');
    } catch (error) {
        console.error('❌ Error inserting kits:', error);
    } finally {
        const client = getClient();
        if (client) await client.close();
    }
}

run();
