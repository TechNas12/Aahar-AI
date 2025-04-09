const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Store user data (in production, use a database)
const userData = {};

// Generate diet plan using ChatGPT
async function generateDietPlan(userData) {
    const prompt = `Create a 7-day personalized diet plan for a ${userData.age}-year-old ${userData.gender} with the following details:
    - Height: ${userData.height} cm
    - Weight: ${userData.weight} kg
    - Activity Level: ${userData.activityLevel}
    - Fitness Goal: ${userData.fitnessGoal}
    - Dietary Preference: ${userData.dietaryPreference}
    - Special Conditions: ${userData.specialConditions || 'None'}

    Please provide:
    1. Daily calorie target
    2. Macronutrient breakdown
    3. 7-day meal plan with:
       - Breakfast
       - Mid-morning snack
       - Lunch
       - Evening snack
       - Dinner
    4. Specific portion sizes
    5. Nutritional notes for each meal
    6. Hydration recommendations
    7. General dietary advice based on the user's goals

    Format the response in a clear, structured way with proper headings and bullet points.`;

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating diet plan:', error);
        throw error;
    }
}

// API endpoint to save user data and generate diet plan
app.post('/api/user-profile', async (req, res) => {
    try {
        const userData = req.body;
        const dietPlan = await generateDietPlan(userData);
        
        // Save user data with diet plan
        userData.dietPlan = dietPlan;
        userData.createdAt = new Date().toISOString();
        
        // In production, save to database
        // For now, we'll store in memory
        const userId = Date.now().toString();
        userData[userId] = userData;

        res.json({
            success: true,
            userId,
            dietPlan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to get user profile
app.get('/api/user-profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const profile = userData[userId];
    
    if (!profile) {
        return res.status(404).json({
            success: false,
            error: 'Profile not found'
        });
    }

    res.json({
        success: true,
        profile
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 