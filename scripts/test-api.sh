#!/bin/bash
# ===========================================================
# API Testing Script
# A comprehensive test suite for the Shipping API endpoints
# ===========================================================

# Check for JSON formatting capabilities
if command -v json_pp &>/dev/null; then
	JSON_FORMATTER="json_pp"
elif command -v jq &>/dev/null; then
	JSON_FORMATTER="jq ."
else
	JSON_FORMATTER="cat"
	echo "Note: Install json_pp or jq for formatted JSON output"
fi

# Base URL for API requests
BASE_URL="http://localhost:3000"

# Timestamp for logging
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# ANSI color codes for improved readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# ===========================================================
# Authentication Endpoints
# ===========================================================

echo -e "\n${BLUE}=== Authentication Endpoints ===${NC}"

# Register a new user
# Creates a new account in the system with the provided credentials
echo -e "\n${YELLOW}POST /auth/register${NC} - Register a new user"
curl -s -X POST \
	"$BASE_URL/auth/register" \
	-H "Content-Type: application/json" \
	-d '{
    "email": "test@example.com",
    "password": "password123"
  }' | $JSON_FORMATTER

# Login to obtain authentication token
# Returns a JWT token required for authenticated endpoints
echo -e "\n${YELLOW}POST /auth/login${NC} - Authenticate and obtain token"
LOGIN_RESPONSE=$(curl -s -X POST \
	"$BASE_URL/auth/login" \
	-H "Content-Type: application/json" \
	-d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | $JSON_FORMATTER

# Extract token for subsequent requests
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}Token obtained successfully${NC}"

# Logout from the system
# Invalidates the current session on the client side
echo -e "\n${YELLOW}POST /auth/logout${NC} - End the current session"
curl -s -X POST \
	"$BASE_URL/auth/logout" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# List all users (admin only)
# Restricted endpoint requiring administrative privileges
echo -e "\n${YELLOW}GET /auth/list${NC} - List all users (admin only)"
curl -s -X GET \
	"$BASE_URL/auth/list" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# ===========================================================
# Address Management Endpoints
# ===========================================================

echo -e "\n${BLUE}=== Address Management Endpoints ===${NC}"

# Save a new address
# Associates a shipping address with the authenticated user
echo -e "\n${YELLOW}POST /addresses${NC} - Save a new address"
curl -s -X POST \
	"$BASE_URL/addresses" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
    "address": "123 Main St, Anytown, NY 12345"
  }' | $JSON_FORMATTER

# Retrieve all saved addresses
# Gets all addresses associated with the authenticated user
echo -e "\n${YELLOW}GET /addresses${NC} - Retrieve saved addresses"
ADDRESS_RESPONSE=$(curl -s -X GET \
	"$BASE_URL/addresses" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json")

echo "$ADDRESS_RESPONSE" | $JSON_FORMATTER

# Extract address ID for deletion in the next step
ADDRESS_ID=$(echo $ADDRESS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

# Delete a saved address
# Removes an address from the user's saved addresses
echo -e "\n${YELLOW}DELETE /addresses/{id}${NC} - Remove an address"
curl -s -X DELETE \
	"$BASE_URL/addresses/$ADDRESS_ID" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# ===========================================================
# User Preference Endpoints
# ===========================================================

echo -e "\n${BLUE}=== User Preference Endpoints ===${NC}"

# Save a new preference
# Stores user preferences for recipients and occasions
echo -e "\n${YELLOW}POST /preferences${NC} - Save a user preference"
curl -s -X POST \
	"$BASE_URL/preferences" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
    "recipient": "Mom",
    "occasion": "Birthday"
  }' | $JSON_FORMATTER

# Retrieve user preferences
# Gets all preferences associated with the authenticated user
echo -e "\n${YELLOW}GET /preferences${NC} - Retrieve user preferences"
curl -s -X GET \
	"$BASE_URL/preferences" \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# ===========================================================
# Shipping Record Endpoints
# ===========================================================

echo -e "\n${BLUE}=== Shipping Record Endpoints ===${NC}"

# Retrieve all shipping records
# Gets all shipping records in the system
echo -e "\n${YELLOW}GET /api/shipping-records${NC} - List all shipping records"
curl -s -X GET \
	"$BASE_URL/api/shipping-records" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# Create a new shipping record
# Creates a new shipping record with all required fields
echo -e "\n${YELLOW}POST /api/shipping-records${NC} - Create a shipping record"
NEW_RECORD_RESPONSE=$(curl -s -X POST \
	"$BASE_URL/api/shipping-records" \
	-H "Content-Type: application/json" \
	-d '{
    "sender_name": "John Doe",
    "recipient_name": "Jane Smith",
    "zip_from": "10001",
    "zip_to": "90210",
    "shipping_method": "Priority",
    "ordered_date": "2025-03-27",
    "delivery_date": "2025-04-02"
  }')

echo "$NEW_RECORD_RESPONSE" | $JSON_FORMATTER

# Extract the new record ID for update and deletion
NEW_RECORD_ID=$(echo $NEW_RECORD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

# Retrieve the newly created shipping record
# Gets details of a single shipping record by ID
echo -e "\n${YELLOW}GET /api/shipping-records/{id}${NC} - Get specific shipping record"
curl -s -X GET \
	"$BASE_URL/api/shipping-records/$NEW_RECORD_ID" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# Update a shipping record
# Updates all fields of an existing record (note: requires all mandatory fields)
echo -e "\n${YELLOW}PUT /api/shipping-records/{id}${NC} - Update a shipping record"
curl -s -X PUT \
	"$BASE_URL/api/shipping-records/$NEW_RECORD_ID" \
	-H "Content-Type: application/json" \
	-d '{
    "sender_name": "John Doe",
    "recipient_name": "Jane Smith",
    "zip_from": "10001",
    "zip_to": "90210",
    "shipping_method": "Priority",
    "ordered_date": "2025-03-27",
    "delivery_date": "2025-04-02",
    "occasion": "Anniversary Gift"
  }' | $JSON_FORMATTER

# Delete a shipping record
# Permanently removes a shipping record from the system
echo -e "\n${YELLOW}DELETE /api/shipping-records/{id}${NC} - Delete a shipping record"
curl -s -X DELETE \
	"$BASE_URL/api/shipping-records/$NEW_RECORD_ID" \
	-H "Content-Type: application/json" | $JSON_FORMATTER

# ===========================================================
# USPS API Endpoints
# ===========================================================

# WARN: commenting out due to not having USPS token
# TODO: uncomment when ready
# echo -e "\n${BLUE}=== Miscellaneous API Endpoints ===${NC}"
#
# # Get shipping estimates
# # Retrieves estimated delivery times and costs between locations
# echo -e "\n${YELLOW}GET /estimates${NC} - Get shipping estimates"
# curl -s -X GET \
# 	"$BASE_URL/estimates?from=10001&to=90210&method=Priority" \
# 	-H "Content-Type: application/json" | $JSON_FORMATTER
#
# # Get shipping standards
# # Retrieves standardized shipping information between locations
# echo -e "\n${YELLOW}GET /standards${NC} - Get shipping standards"
# curl -s -X GET \
# 	"$BASE_URL/standards?from=10001&to=90210" \
# 	-H "Content-Type: application/json" | $JSON_FORMATTER
#
# # Get available shipping methods
# # Lists all available shipping methods in the system
# echo -e "\n${YELLOW}GET /shipping-methods${NC} - List available shipping methods"
# curl -s -X GET \
# 	"$BASE_URL/shipping-methods" \
# 	-H "Content-Type: application/json" | $JSON_FORMATTER

echo -e "\n${GREEN}API Test Suite completed at $TIMESTAMP${NC}"