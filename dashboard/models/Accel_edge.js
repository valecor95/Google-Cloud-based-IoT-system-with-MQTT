const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const Accel_edgeSchema = new Schema({
  deviceId:{type: String, required: true},
  date:{type: Number, required: true},
  status:{type: String, required: true}
});

mongoose.model('accel_edge', Accel_edgeSchema);
