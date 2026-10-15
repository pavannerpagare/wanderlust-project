require("dotenv").config();

const { understandSearchQuery } = require("./services/aiService");

async function test() {
    try {
        const result = await understandSearchQuery(
            "Show me the highest rated stays in Bali"
        );
        
        console.log(result);
    } catch (error) {
        console.error("AI Error:", error.message);
    }
}

test();