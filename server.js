import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import qs from "qs";
import NodeCache from "node-cache";
import winston from "winston";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import shippingRoutes from "./routes/shipping-api.js";
import preferencesRoutes from "./routes/preferences.js";
import addressRoutes from "./routes/addresses.js";
import estimatesRoutes from "./routes/estimates.js";
import { router as authRoutes } from "./routes/auth.js";
import { addBusinessDays } from "./holidayHandler.js";
import adminRoutes from './routes/admin.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir);
}

// configure logger
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: winston.format.combine(
		winston.format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss",
		}),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json(),
	),
	defaultMeta: { service: "shipping-api" },
	transports: [
		new winston.transports.File({
			filename: path.join(logsDir, "error.log"),
			level: "error",
		}),
		new winston.transports.File({
			filename: path.join(logsDir, "combined.log"),
		}),
	],
});

if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	);
}

const app = express();
const port = process.env.PORT || 3001;
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Make cache available to all routes
app.set('cache', cache);

// Enhanced CORS configuration
app.use(cors({
	origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'],
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
	preflightContinue: false,
	optionsSuccessStatus: 204
}));

// Log every request including CORS preflight
app.use((req, res, next) => {
	logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
		headers: req.headers,
		ip: req.ip,
		path: req.path,
		method: req.method
	});
	next();
});

// Add a more permissive handler for OPTIONS requests
app.options('*', (req, res) => {
	logger.info('Handling OPTIONS preflight request', {
		path: req.path,
		origin: req.headers.origin,
		method: req.method
	});
	
	// Use wildcard to handle all origins
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
	res.header('Access-Control-Max-Age', '86400'); // 24 hours
	res.status(204).end();
});

// Additional middleware to add CORS headers to all responses
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
	next();
});

app.use((req, res, next) => {
	const start = Date.now();

	res.on("finish", () => {
		const duration = Date.now() - start;
		logger.info({
			type: "request",
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			duration: `${duration}ms`,
			userAgent: req.get("user-agent") || "unknown",
			ip: req.ip || req.connection.remoteAddress,
		});
	});

	next();
});

app.use((req, res, next) => {
	req.logger = logger;
	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Better error handling for JSON parsing errors
app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		logger.error("JSON parsing error:", { error: err.message });
		return res.status(400).json({ error: "Invalid JSON in request body" });
	}
	next(err);
});

app.use("/auth", authRoutes);
app.use("/preferences", preferencesRoutes);
app.use("/addresses", addressRoutes);
app.use('/admin', adminRoutes);
// Log when the estimates routes are being registered
console.log("Registering estimates routes at /estimates");
app.use("/estimates", estimatesRoutes);

// Log when shipping records routes are registered
console.log("Registering shipping records routes at /api/shipping-records");
app.use("/api/shipping-records", shippingRoutes);

// ShipEngine API Configuration
const SHIPENGINE_BASE_URL = 'https://api.shipengine.com/v1';

// Get ShipEngine API headers
const getShipEngineHeaders = () => {
	return {
		'Content-Type': 'application/json',
		'Authorization': `ShipEngine ${process.env.SHIPENGINE_API_KEY}`
	};
};

async function callShipEngineApi(fromZip, toZip, weightOz = 1) {
	const url = "https://api.shipengine.com/v1/rates/estimate";

	const payload = {
		carrier_ids: [], // empty will use all carriers
		from_postal_code: fromZip,
		to_postal_code: toZip,
		weight: {
			value: weightOz,
			unit: "ounce"
		},
		confirmation: "none",
		address_residential_indicator: "no"
	};

	try {
		const response = await axios.post(url, payload, {
			headers: getShipEngineHeaders()
		});

		return response.data;
	} catch (error) {
		logger.error("Error calling ShipEngine API", {
			fromZip,
			toZip,
			error: error.message,
			stack: error.stack
		});
		throw error;
	}
}

function getCachedRoute(from, to, weight) {
	const cacheKey = `${from}-${to}-${weight}`;
	const cachedData = cache.get(cacheKey);

	if (cachedData) {
		logger.debug("Cache hit", { cacheKey });
	} else {
		logger.debug("Cache miss", { cacheKey });
	}

	return cachedData;
}

function setCachedRoute(from, to, weight, data) {
	const cacheKey = `${from}-${to}-${weight}`;
	cache.set(cacheKey, data);
	logger.debug("Cache updated", { cacheKey });
}

// Helper function to get card processing days
function getProcessingDays(cardType) {
	const processingTimes = {
		'standard_card': 1,
		'custom_card': 2,
		'special_edition': 3,
		'bulk_order': 5
	};
	
	return processingTimes[cardType] || 1; // Default to 1 day if type not specified
}

// Helper function to get default delivery days based on shipping method
function getDefaultDeliveryDays(method) {
	const deliveryTimes = {
		'standard': 5,
		'priority': 3,
		'express': 2
	};
	
	return deliveryTimes[method] || 5; // Default to 5 days if method not specified
}

app.get("/estimates", async (req, res) => {
	const { from, to, weight } = req.query;

	logger.info("Handling ShipEngine shipping estimate request", { from, to });

	const cachedData = getCachedRoute(from, to, weight);
	if (cachedData) return res.json(cachedData);

	try {
		const data = await callShipEngineApi(from, to, Number(weight) || 1);

		// Filter essential info from all rates
		const rates = data.rate_response.rates.map(rate => ({
			carrier: rate.carrier_friendly_name,
			service: rate.service_type,
			days: rate.delivery_days,
			amount: rate.shipping_amount.amount,
			currency: rate.shipping_amount.currency
		}));

		setCachedRoute(from, to, weight, rates);
		res.json({ from, to, weight: Number(weight) || 1, rates });
	} catch (error) {
		res.status(500).json({ error: "Failed to get shipping estimates" });
	}
});

// Address validation endpoint
app.post("/validate-address", async (req, res, next) => {
	try {
		const address = req.body;
		
		// Validate required fields
		if (!address.address_line1 || !address.city_locality || 
			!address.state_province || !address.postal_code || !address.country_code) {
			return res.status(400).json({ error: 'Missing required address fields' });
		}
		
		// Format request
		const url = `${SHIPENGINE_BASE_URL}/addresses/validate`;
		const payload = [address];
		const headers = getShipEngineHeaders();
		
		// Send API request
		const response = await axios.post(url, payload, { headers });
		
		// Return validation results
		res.status(200).json(response.data);
	} catch (error) {
		logger.error("Error validating address", {
			address: req.body,
			error: error.message,
			stack: error.stack
		});
		res.status(500).json({ error: "Failed to validate address" });
	}
});

// Get enhanced shipping rate estimates (including reminder day calculations)
app.post("/shipping-estimate", async (req, res, next) => {
	console.log("Incoming shipping-estimate request:", req.body);
	try {
		const {
			carrier_id,
			from_country_code, 
			from_postal_code,
			to_country_code, 
			to_postal_code,
			weight,
			event_date,
			shipping_method,
			card_type
		} = req.body;
		
		// Validate required fields
		if (!weight || typeof weight !== 'object' || !weight.value || !weight.unit) {
			return res.status(400).json({ error: 'Missing required shipping parameters' });
		}
		
		// Create cache key
		const cacheKey = `${from_postal_code}-${to_postal_code}-${JSON.stringify(weight)}`;
		// Try to get cached data
		const cachedData = cache.get(cacheKey);
		
		if (cachedData) {
			logger.debug("Cache hit", { cacheKey });
			return res.status(200).json(cachedData);
		}
		
		// Format request
		const url = `${SHIPENGINE_BASE_URL}/rates/estimate`;
		const payload = {
			carrier_ids: carrier_id ? [carrier_id] : [],
			from_country_code: from_country_code || "US",
			from_postal_code,
			to_country_code: to_country_code || "US",
			to_postal_code,
			weight
		};
		
		// Send API request
		const response = await axios.post(url, payload, { headers: getShipEngineHeaders() });
		
		// Get processing time based on card type
		const processingDays = getProcessingDays(card_type);
		
		// If event date is provided, calculate reminder days
		let reminderInfo = {};
		if (event_date) {
			// Get minimum shipping time from shipping rate response
			const rates = response.data.rate_response?.rates || [];
			const firstRate = rates[0] || {};
			const deliveryDays = firstRate.delivery_days || getDefaultDeliveryDays(shipping_method);
			
			// Calculate days until event
			const eventDateObj = new Date(event_date);
			const currentDate = new Date();
			const msPerDay = 1000 * 60 * 60 * 24;
			const daysUntilEvent = Math.ceil((eventDateObj - currentDate) / msPerDay);
			
			// Use holidayHandler to calculate business days
			let deliveryDate = new Date(currentDate);
			deliveryDate = addBusinessDays(deliveryDate, deliveryDays + processingDays);
			
			// Calculate reminder days (order time)
			const reminderDays = Math.max(0, daysUntilEvent - deliveryDays - processingDays);
			
			reminderInfo = {
				processing_days: processingDays,
				estimated_delivery_days: deliveryDays,
				days_until_event: daysUntilEvent,
				reminder_days: reminderDays,
				estimated_delivery_date: deliveryDate,
				order_by_date: new Date(Date.now() + (reminderDays * msPerDay))
			};
		}
		
		// Format response
		const rates = response.data.rate_response?.rates?.map(rate => ({
			carrier: rate.carrier_friendly_name,
			service: rate.service_type,
			days: rate.delivery_days,
			amount: rate.shipping_amount.amount,
			currency: rate.shipping_amount.currency
		})) || [];
		
		// Add reminder information to response
		const result = {
			from: from_postal_code,
			to: to_postal_code,
			weight: weight.value,
			rates: rates,
			timeline: reminderInfo
		};
		
		// Cache results
		cache.set(cacheKey, result);
		logger.debug("Cache updated", { cacheKey });
		
		res.status(200).json(result);
	} catch (error) {
		logger.error("Error calculating shipping estimate", {
			from: req.body.from_postal_code,
			to: req.body.to_postal_code,
			error: error.message,
			stack: error.stack
		});
		res.status(500).json({ error: "Failed to calculate shipping estimate" });
	}
});

app.get("/shipping-methods", (req, res) => {
	logger.info("Retrieving available shipping methods");
	const shippingMethods = ["Standard", "Priority", "Express"];
	res.json(shippingMethods);
});

app.use((err, req, res, next) => {
	logger.error("Unhandled application error:", {
		error: err.message,
		stack: err.stack,
		method: req.method,
		url: req.originalUrl,
	});

	res.status(500).json({
		error: "Internal server error",
		message:
			process.env.NODE_ENV === "production"
				? "An unexpected error occurred"
				: err.message,
	});
});

app.use(express.static('.'));
console.log('Serving static files from current directory');

app.get("/", (req, res) => {
	res.send(`
		<html>
			<head><title>Shipping API Server</title></head>
			<body>
				<h1>Shipping API Server</h1>
				<p>Server is running.</p>
				<p><a href="/test-api.html">Go to API Test Page</a></p>
			</body>
		</html>
	`);
});

app.listen(port, () => {
	logger.info(`Server started on port ${port} - use http://localhost:${port} in browser`);
	logger.info(`Frontend should be configured to use http://localhost:${port} for API requests`);
	logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Promise Rejection:", {
		reason: reason.toString(),
		stack: reason.stack,
	});
});

process.on("uncaughtException", (error) => {
	logger.error("Uncaught Exception:", {
		error: error.message,
		stack: error.stack,
	});
	process.exit(1);
});
