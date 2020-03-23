const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Event Schema
const ValuesSchema = new Schema({
  deviceId:{type: String, required: true},
  value:{type: String, required: true},
  date:{type: Number, required: true}
});

mongoose.model('values', ValuesSchema);
