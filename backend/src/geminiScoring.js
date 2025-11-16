/**
 * Gemini AI-powered route safety scoring
 * Uses Google Gemini API to analyze routes and provide intelligent safety scores
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

// Initialize Gemini API client
export function initializeGemini(apiKey) {
  if (!apiKey) {
    console.warn('Gemini API key not provided, AI scoring disabled');
    return false;
  }
  
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini API initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Gemini:', error);
    return false;
  }
}

/**
 * Score a route using Gemini AI
 * @param {Object} route - Route object with safety features
 * @param {Object} context - Additional context (location, time, etc.)
 * @returns {Promise<Object>} { score: number, reason: string, confidence: number }
 */
export async function scoreRouteWithGemini(route, context = {}) {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare route data for analysis
    const routeData = {
      distance: route.distance_km || route.distance,
      duration: route.duration_min || route.duration,
      crime: route.crime || 0,
      darkAreas: route.darkAreas || 0,
      traffic: route.traffic || 0,
      incidents: route.incidents || [],
      pois: route.pois || [],
      timeOfDay: context.timeOfDay || new Date().getHours(),
      location: context.location || 'Unknown'
    };

    // Create a detailed prompt for Gemini
    const prompt = `You are a safety analysis expert for urban navigation routes.

Analyze this route and provide a safety score from 0-10 (10 = safest, 0 = most dangerous).

Route Data:
- Distance: ${routeData.distance} km
- Duration: ${routeData.duration} minutes
- Crime incidents: ${routeData.crime}
- Dark/poorly lit areas: ${routeData.darkAreas}
- Traffic congestion level: ${routeData.traffic}
- Time of day: ${routeData.timeOfDay}:00
- Location: ${routeData.location}
- Traffic incidents: ${routeData.incidents.length}
- Safety POIs nearby (police, hospitals): ${routeData.pois.length}

Consider these factors:
1. Crime rate (higher = more dangerous)
2. Lighting conditions (dark areas = more dangerous)
3. Traffic congestion (heavy traffic = more dangerous)
4. Time of day (night = more dangerous)
5. Presence of safety infrastructure (police, hospitals = safer)
6. Traffic incidents (more incidents = more dangerous)

Return your response as a JSON object with this exact format:
{
  "score": <number between 0-10>,
  "reason": "<brief explanation of safety assessment>",
  "confidence": <number between 0-1>,
  "risks": ["<risk1>", "<risk2>", ...],
  "recommendations": ["<recommendation1>", "<recommendation2>", ...]
}

Be specific and practical in your analysis.`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let aiAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        aiAnalysis = JSON.parse(text);
      }
    } catch (parseError) {
      // If JSON parsing fails, extract score and reason manually
      console.warn('Failed to parse Gemini JSON, extracting manually:', parseError);
      const scoreMatch = text.match(/score["\s:]*(\d+\.?\d*)/i);
      const reasonMatch = text.match(/reason["\s:]*["']?([^"'\n]+)/i);
      
      aiAnalysis = {
        score: scoreMatch ? parseFloat(scoreMatch[1]) : 5,
        reason: reasonMatch ? reasonMatch[1] : 'AI analysis completed',
        confidence: 0.7,
        risks: [],
        recommendations: []
      };
    }

    // Normalize score to 0-1 range (for consistency with other scoring)
    const normalizedScore = aiAnalysis.score / 10;
    
    return {
      score: normalizedScore,
      rawScore: aiAnalysis.score,
      reason: aiAnalysis.reason || 'AI safety analysis',
      confidence: aiAnalysis.confidence || 0.8,
      risks: aiAnalysis.risks || [],
      recommendations: aiAnalysis.recommendations || [],
      source: 'Gemini AI'
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini scoring failed: ${error.message}`);
  }
}

/**
 * Compare multiple routes and rank them using Gemini
 * @param {Array<Object>} routes - Array of route objects
 * @param {Object} context - Additional context
 * @returns {Promise<Array>} Sorted routes with AI scores
 */
export async function rankRoutesWithGemini(routes, context = {}) {
  if (!genAI) {
    throw new Error('Gemini API not initialized');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare routes data
    const routesData = routes.map((r, i) => ({
      id: i + 1,
      distance: r.distance_km || r.distance,
      duration: r.duration_min || r.duration,
      crime: r.crime || 0,
      darkAreas: r.darkAreas || 0,
      traffic: r.traffic || 0,
      incidents: r.incidents || [],
      pois: r.pois || []
    }));

    const prompt = `You are a safety analysis expert. Compare these ${routes.length} routes and rank them by safety.

Routes:
${JSON.stringify(routesData, null, 2)}

Context:
- Time: ${context.timeOfDay || new Date().getHours()}:00
- Location: ${context.location || 'Urban area'}

For each route, provide:
1. Safety score (0-10, 10 = safest)
2. Brief reason
3. Main risks
4. Recommendation

Return JSON array with this format:
[
  {
    "routeId": 1,
    "score": <0-10>,
    "reason": "<explanation>",
    "risks": ["<risk1>", "<risk2>"],
    "recommendation": "<should take this route?>"
  },
  ...
]

Rank routes from safest to most dangerous.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse response
    let rankings;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rankings = JSON.parse(jsonMatch[0]);
      } else {
        rankings = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Failed to parse rankings:', parseError);
      // Fallback: score each route individually
      const scoredRoutes = await Promise.all(
        routes.map((r, i) => scoreRouteWithGemini(r, context))
      );
      return routes.map((r, i) => ({
        ...r,
        aiScore: scoredRoutes[i].score,
        aiReason: scoredRoutes[i].reason
      })).sort((a, b) => b.aiScore - a.aiScore);
    }

    // Merge rankings with routes
    return routes.map((r, i) => {
      const ranking = rankings.find(rk => rk.routeId === i + 1) || rankings[i];
      return {
        ...r,
        aiScore: (ranking?.score || 5) / 10, // Normalize to 0-1
        rawAiScore: ranking?.score || 5,
        aiReason: ranking?.reason || 'AI analysis',
        aiRisks: ranking?.risks || [],
        aiRecommendation: ranking?.recommendation || 'Consider this route'
      };
    }).sort((a, b) => b.aiScore - a.aiScore);
    
  } catch (error) {
    console.error('Gemini ranking error:', error);
    throw error;
  }
}

/**
 * Get detailed safety explanation for a route
 * @param {Object} route - Route object
 * @param {Object} context - Context
 * @returns {Promise<string>} Detailed explanation
 */
export async function getRouteSafetyExplanation(route, context = {}) {
  if (!genAI) {
    return 'Gemini API not available for detailed explanation';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Provide a detailed safety explanation for this route:

Route: ${JSON.stringify(route, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Explain:
1. Overall safety assessment
2. Specific risks and concerns
3. Safety features and positives
4. Recommendations for safe travel
5. Best time to travel this route

Be concise but informative.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Gemini explanation error:', error);
    return 'Unable to generate detailed explanation';
  }
}

