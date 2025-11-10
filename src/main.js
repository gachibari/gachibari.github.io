document.addEventListener('alpine:init', () => {
  const { Client, TablesDB, Query, ID } = Appwrite;
  const config = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('gachibari');
  
  const tablesDB = new TablesDB(config);
  const districts = [
    'ঢাকা', 'ফরিদপুর', 'গাজীপুর', 'গোপালগঞ্জ', 'কিশোরগঞ্জ', 'মাদারীপুর', 'মানিকগঞ্জ', 'মুন্সীগঞ্জ', 'নারায়ণগঞ্জ', 'নরসিংদী', 'রাজবাড়ী', 'শরীয়তপুর', 'টাঙ্গাইল', 'চুয়াডাঙ্গা', 'ঝিনাইদহ', 'কুষ্টিয়া', 'মেহেরপুর', 'মাগুরা', 'খুলনা', 'বাগেরহাট', 'যশোর', 'নড়াইল', 'সাতক্ষীরা',
    'বান্দরবান', 'ব্রাহ্মণবাড়িয়া', 'চাঁদপুর', 'চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'ফেনী', 'খাগড়াছড়ি', 'লক্ষ্মীপুর', 'নোয়াখালী', 'রাঙ্গামাটি',
    'বগুড়া', 'জয়পুরহাট', 'নওগাঁ', 'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'পাবনা', 'রাজশাহী', 'সিরাজগঞ্জ',
    'বরগুনা', 'বরিশাল', 'ভোলা', 'ঝালকাঠি', 'পটুয়াখালী', 'পিরোজপুর',
    'হবিগঞ্জ', 'মৌলভীবাজার', 'সিলেট', 'সুনামগঞ্জ',
    'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'লালমনিরহাট', 'নীলফামারী', 'পঞ্চগড়', 'রংপুর', 'ঠাকুরগাঁও',
    'জামালপুর', 'ময়মনসিংহ', 'নেত্রকোনা', 'শেরপুর'
  ];
  
  Alpine.data('app', () => ({
    contents: {},
    current: 0,
    shippingFee: 0,
    reviews: [],
    products: [],
    deliveries: {},
    showSuccessModal: false,
    showReviewModal: false,
    showReviewSuccess: false,
    reviewSubmitting: false,
    panding: false,
    loading: false,
    districts,
    features: [],
    faqs: [],
    
    reviewForm: {
      name: '',
      rating: 5,
      comment: ''
    },
    orderForm: {
      name: '',
      phone: '',
      district: '',
      address: '',
      comment: '',
      products: [],
    },
    async submitReview() {
      try {
        this.reviewSubmitting = true;
        
        let ress = await fetch('https://68e84d0af2707e6128ca6a30.mockapi.io/api/v1/landing/reviews', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            reviews: [...this.reviews, {
              id: crypto.randomUUID(),
              name: this.reviewForm.name,
              rating: this.reviewForm.rating,
              comment: this.reviewForm.comment,
            }]
          })
        });
        if (ress.ok) {
          this.reviewSubmitting = false;
          this.showReviewModal = false;
          this.showReviewSuccess = true;
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        this.reviewSubmitting = false;
        this.showReviewModal = false;
        this.reviewForm = {
          name: '',
          rating: 5,
          comment: ''
        };
      }
    },
    async init() {
      try {
        this.loading = true;
        
        // Load content in parallel
        const [products, reviews, deliveries, features, faqs, contents] = await fetch('https://68e84d0af2707e6128ca6a30.mockapi.io/api/v1/landing').then(ress => ress.json());
        
        this.contents = contents.contents;
        this.products = products.products;
        this.reviews = reviews.reviews;
        this.deliveries = deliveries.deliveries;
        this.features = features.features;
        this.faqs = faqs.faqs;
        
        this.orderForm.products = this.products.map(product => ({
          ...product,
          selected: false,
          quantity: 1,
        }));
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        this.loading = false;
      }
    },
    increaseQuantity(index) {
      this.orderForm.products[index].quantity += 1;
    },
    decreaseQuantity(index) {
      if (this.orderForm.products[index].quantity > 1) {
        this.orderForm.products[index].quantity -= 1;
      }
    },
    isValidBDNumber(phoneNumber) {
      phoneNumber = phoneNumber.replace(/\D/g, '');
      
      const bdOperatorCodes = ['013', '014', '015', '016', '017', '018', '019'];
      
      if (phoneNumber.length === 11) {
        const operatorCode = phoneNumber.slice(0, 3);
        if (bdOperatorCodes.includes(operatorCode)) {
          return true;
        }
      }
      
      return false;
    },
    async submitOrder() {
      const selectedProducts = this.orderForm.products.filter(p => p.selected);
      if (!selectedProducts.length) {
        alert('অনুগ্রহ করে কমপক্ষে একটি পণ্য নির্বাচন করুন।');
        return;
      }
      if (!this.orderForm.name || !this.isValidBDNumber(this.orderForm.phone) || !this.orderForm.district || !this.orderForm.address) {
        alert('অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন।');
        return;
      }
      try {
        this.panding = true;
        await tablesDB.createRow({
          databaseId: '68e8c0740016ef6075ed',
          tableId: 'orders',
          rowId: ID.unique(),
          data: {
            customer: JSON.stringify({
              name: this.orderForm.name,
              phone: this.orderForm.phone,
              district: this.orderForm.district,
              address: this.orderForm.address,
              comment: this.orderForm.comment,
            }),
            items: JSON.stringify(selectedProducts.map(p => ({
              name: p.name,
              quantity: p.quantity,
              price: p.price,
              image: p.image,
              total: p.price * p.quantity,
            }))),
            total: this.totalPrice,
            date: new Date().toLocaleString(),
            status: 'pending',
          }
        });
        this.showSuccessModal = true;
      } catch (error) {
        console.error('Order submission failed:', error);
        alert('অর্ডার জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      } finally {
        this.panding = false;
      }
    },
    resetForm() {
      this.orderForm = {
        name: '',
        phone: '',
        district: '',
        address: '',
        comment: '',
        products: this.products.map(product => ({
          ...product,
          selected: false,
          quantity: 1,
        })),
      };
      this.shippingFee = 0;
    },
    getDeliveryCharge(district) {
      this.shippingFee = this.deliveries[district] || 100;
    },
    directOrder(index) {
      this.orderForm.products[index].selected = true;
      document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
    },
    next() {
      this.current = (this.current + 1) % this.reviews.length;
    },
    prev() {
      this.current = (this.current - 1 + this.reviews.length) % this.reviews.length;
    },
    get subtotalPrice() {
      return this.orderForm.products
        .filter(p => p.selected)
        .reduce((total, product) => total + (product.price * product.quantity), 0);
    },
    get totalPrice() {
      return this.subtotalPrice + this.shippingFee;
    },
  }));
});
