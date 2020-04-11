const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const ValuesSchema = new Schema({
  deviceId:{type: String, required: true},
  date:{type: Number, required: true},
  temperature: {type: String, required: true},
  humidity: {type: String, required: true},
  wind_direction: {type: String, required: true},
  wind_intensity: {type: String, required: true},
  rain_height: {type: String, required: true}
});

mongoose.model('values', ValuesSchema);
