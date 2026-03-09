export const safeJSONParse = (data, defaultValue = []) => {
    if (!data || data === "") return defaultValue;
    if (typeof data !== 'string') return data; // If already an object/array, return as is
    try {
        const parsed = JSON.parse(data);
        return parsed || defaultValue;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return defaultValue;
    }
};

export const safeJSONStringify = (data) => {
    try {
        return JSON.stringify(data);
    } catch (e) {
        console.error("JSON Stringify Error:", e);
        return "";
    }
};

export const getDeviceId = () => {
    let devId = localStorage.getItem('bgmi_device_id');
    if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('bgmi_device_id', devId);
    }
    return devId;
};

export const TOURNAMENT_DOC_ID = "tgAL1VaR1AnqAEk6A4oc";
export const TOURNAMENT_COLLECTION = "DATA";

// Image Upload Configuration
export const IMGBB_API_KEY = "8d44fe54ab424f9f79d4b8afab42a871";
