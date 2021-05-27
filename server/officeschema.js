import mongoose from "mongoose";

const { model } = mongoose;

export default {

    sensorLog: model("sensorlog", {
        logTime: Date,
        temp: Number,
        humidity: Number,
        isLight: Boolean,
        isDoorEvent: Boolean,
        isDoorOpen: Boolean,
        hasMotion: Boolean,
        isFanOn: Boolean
    }),

    command: model("command", {
        insertTime: Date,
        type: String,
        status: Boolean
    })
};