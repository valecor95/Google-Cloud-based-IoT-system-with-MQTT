const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const Accel_cloudSchema = new Schema({
  deviceId:{type: String, required: true},
  x:{type: Number, required: true},
  y:{type: Number, required: true},
  z:{type: Number, required: true},
  magnitude:{type: Number, required: true},
  date:{type: Number, required: true},
  status:{type: Number, required: true}
});

mongoose.model('accel_cloud', Accel_cloudSchema);
