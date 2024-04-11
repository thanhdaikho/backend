const port = 4000;
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const cors = require('cors')

app.use(express.json())
app.use(cors())

mongoose.connect('mongodb+srv://thanhphucnguyen:Tv30122002@cluster0.mjlxaho.mongodb.net/ecommerce')

app.get("/", (req, res) => {
    res.send('Express app is running')
})

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({ storage: storage })
// Thêm một storage mới cho việc lưu trữ ảnh của upload multiple
const multiStorage = multer.diskStorage({
    destination: './upload/multiple_images/',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Khởi tạo middleware upload cho việc upload multiple
const uploadMultiple = multer({ storage: multiStorage }).array('images', 10); // 'images' là tên field trong form

// Endpoint để xử lý việc upload multiple images
app.post('/uploadmultiple', (req, res) => {
    // Sử dụng middleware uploadMultiple để xử lý việc upload nhiều images
    uploadMultiple(req, res, async (err) => {
        if (err) {
            console.error('Error uploading multiple images:', err);
            return res.status(500).json({ error: 'Failed to upload images' });
        }

        try {
            const imageUrls = req.files.map(file => ({
                imageUrl: `http://localhost:${port}/images/${file.filename}`
            }));

            res.status(200).json({ success: true, imageUrls });
        } catch (error) {
            console.error('Error processing uploaded images:', error);
            res.status(500).json({ error: 'Failed to process uploaded images' });
        }
    });
});


app.use(`/images`, express.static('upload/images'))
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

app.post('/addfruit', async (req, res) => {
    try {
        const newFruit = new Fruit({
            name: req.body.name,
            quantity: req.body.quantity,
            price: req.body.price,
            status: req.body.status,
            description: req.body.description,
            images: req.body.images
        });

        await newFruit.save();

        res.json({
            success: true,
            message: 'Fruit added successfully!'
        });
    } catch (error) {
        console.error('Error adding fruit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const Fruit = mongoose.model("Fruit", {
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [Object],
        required: true
    }
})
const Order = mongoose.model("Order", {
    orderId: {
        type: String,
        required: true
    },
    date_create: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: String,
        required: true
    },
    itemId: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    }
})
const User = mongoose.model("User", {
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    }
})
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
})
app.get('/products/filterByName', async (req, res) => {
    const { name } = req.query;
    try {
        const regex = new RegExp(name, 'i'); // Case-insensitive search
        const products = await Product.find({ name: regex });
        res.json(products);
    } catch (error) {
        console.error('Error filtering products by name:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/products/sortByPrice', async (req, res) => {
    const { sortOrder } = req.query; // 'asc' or 'desc'
    try {
        const sortCriteria = sortOrder === 'asc' ? { new_price: 1 } : { new_price: -1 };
        const products = await Product.find({}).sort(sortCriteria);
        res.json(products);
    } catch (error) {
        console.error('Error sorting products by price:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint để lấy danh sách sản phẩm theo trang
app.get('/products', async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Mặc định lấy trang đầu tiên, mỗi trang có 10 sản phẩm

    try {
        const skip = (page - 1) * limit;
        const products = await Product.find({}).skip(skip).limit(parseInt(limit));

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/products/filterByMinPrice', async (req, res) => {
    const { minPrice } = req.query;

    try {
        const products = await Product.find({ new_price: { $gte: parseInt(minPrice) } });
        res.json(products);
    } catch (error) {
        console.error('Error filtering products by minimum price:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/allproducts', async (req, res) => {
    let products = await Product.find({})
    console.log("All products fetched")
    res.send(products)
})
app.get('/allorders', async (req, res) => {
    let orders = await Order.find({})
    res.send(orders)
})
app.get('/allusers', async (req, res) => {
    let users = await User.find({})
    res.send(users)
})
app.get('/allfruits', async (req, res) => {
    let fruits = await Fruit.find({})
    res.send(fruits)
})
app.post('/adduser', async (req, res) => {
    let users = await User.find({})
    const user = new User({
        userId: req.body.userId,
        userName: req.body.userName,
        password: req.body.password,
        email: req.body.email,
        avatar: req.body.avatar
    })
    await user.save()
    res.json({
        success: true,
        name: req.body.userName
    })
})
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({})
    let id
    if (products.length > 0) {
        let last_product_array = products.slice(-1)
        let last_product = last_product_array[0]
        id = last_product.id + 1
    } else {
        id = 1
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    })
    console.log(product)
    await product.save()
    console.log("Saved")
    res.json({
        success: true,
        name: req.body.name
    })
})

app.post('/addorder', async (req, res) => {
    let orders = await Order.find({})
    const order = new Order({
        orderId: req.body.orderId,
        userId: req.body.userId,
        itemId: req.body.itemId,
        address: req.body.address,
        payment_method: req.body.payment_method
    })
    await order.save()
    res.json({
        success: true,
        id: req.body.orderId
    })
})
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id })
    console.log("Removed")
    res.json({
        success: true,
        name: req.body.name
    })
})
app.post('/removeorder', async (req, res) => {
    await Order.findOneAndDelete({ orderId: req.body.orderId })
    console.log("Removed")
    res.json({
        success: true,
        orderId: req.body.orderId
    })
})
app.get('/newcollection', async (req, res) => {
    let products = await Product.find({})
    let newcollection = products.slice(1).slice(-8)
    res.send(newcollection)
})
app.get('/popularinwomen', async (req, res) => {
    let products = await Product.find({ category: "women" })
    let popular_in_women = products.slice(0, 4)
    res.send(popular_in_women)
})
app.get('/popularinmen', async (req, res) => {
    let products = await Product.find({ category: "men" })
    let popular_in_men = products.slice(0, 4)
    res.send(popular_in_men)
})
app.get('/popularinkid', async (req, res) => {
    let products = await Product.find({ category: "kid" })
    let popular_in_kid = products.slice(0, 4)
    res.send(popular_in_kid)
})
app.post('/addtocart', async (req, res) => {

})
app.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const regex = new RegExp(query, 'i'); // Case-insensitive search
        const products = await Product.find({ name: regex });
        res.json(products);
    } catch (error) {
        console.error('Error searching products: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(port, (error) => {
    if (!error) {
        console.log('Sever running on port 4000')
    } else {
        console.log('Error: ' + e)
    }

})