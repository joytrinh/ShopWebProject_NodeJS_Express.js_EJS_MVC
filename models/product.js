const mongoose = require('mongoose')
const Schema = mongoose.Schema //constructor to make a schema
const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageURL: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', //refer to User model => a relation setup. We also add a ref in User
    required: true
  }
})

module.exports = mongoose.model('Product', productSchema)//mongoose takes this name and create a collection named "products" in db