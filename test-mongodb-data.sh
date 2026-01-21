#!/bin/bash

# Test script to add sample data to MongoDB via API
# Run this after starting the dev server: npm run dev

echo "🧪 Testing MongoDB Integration..."
echo ""

# Test 1: Add Client 1
echo "1️⃣  Adding Client 1..."
CLIENT1=$(curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client 1",
    "email": "testclient1@example.com",
    "phone": "+1234567890",
    "company": "Test Company Inc",
    "status": "Active"
  }')
echo "✅ Client 1 added: $(echo $CLIENT1 | grep -o '"name":"[^"]*"' | head -1)"
echo ""

# Test 2: Add Client 2
echo "2️⃣  Adding Client 2..."
CLIENT2=$(curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@techcorp.com",
    "phone": "+1987654321",
    "company": "Tech Corp Solutions",
    "status": "Lead",
    "clientTier": "Gold"
  }')
echo "✅ Client 2 added: $(echo $CLIENT2 | grep -o '"name":"[^"]*"' | head -1)"
echo ""

# Test 3: Add Team Member
echo "3️⃣  Adding Team Member..."
TEAM=$(curl -s -X POST http://localhost:3000/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah.johnson@rootkit.dev",
    "role": "Senior Developer",
    "hourlyRate": 75,
    "availability": "Available"
  }')
echo "✅ Team member added: $(echo $TEAM | grep -o '"name":"[^"]*"' | head -1)"
echo ""

# Test 4: Add Project
echo "4️⃣  Adding Project..."
PROJECT=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Platform",
    "description": "Build a modern e-commerce platform with React and Node.js",
    "client": "Test Company Inc",
    "startDate": "2025-01-15",
    "deadline": "2025-03-15",
    "budget": 50000,
    "status": "In Progress"
  }')
echo "✅ Project added: $(echo $PROJECT | grep -o '"name":"[^"]*"' | head -1)"
echo ""

# Test 5: Add Revenue
echo "5️⃣  Adding Revenue Record..."
REVENUE=$(curl -s -X POST http://localhost:3000/api/revenue \
  -H "Content-Type: application/json" \
  -d '{
    "type": "income",
    "amount": 10000,
    "description": "Payment for E-Commerce Platform - Phase 1",
    "date": "2025-01-20",
    "status": "paid"
  }')
echo "✅ Revenue added: $(echo $REVENUE | grep -o '"amount":[0-9]*' | head -1)"
echo ""

echo "🎉 All test data added successfully!"
echo ""
echo "📊 Verify in MongoDB Atlas:"
echo "   1. Go to MongoDB Atlas Dashboard"
echo "   2. Browse Collections → admin-panel-rootkit"
echo "   3. Check: clients, teams, projects, revenue collections"
echo ""
echo "🌐 Or view via API:"
echo "   - Clients: http://localhost:3000/api/clients"
echo "   - Team: http://localhost:3000/api/team"
echo "   - Projects: http://localhost:3000/api/projects"
echo "   - Revenue: http://localhost:3000/api/revenue"
