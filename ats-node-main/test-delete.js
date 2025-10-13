#!/usr/bin/env node

/**
 * Test script to verify candidate delete functionality
 * Run this script to test the delete API endpoint
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testDeleteAPI() {
    console.log('🧪 Testing Candidate Delete API');
    console.log('================================');

    try {
        // First, let's test if the server is running
        console.log('1. Testing server health...');
        const healthResponse = await fetch(`${BASE_URL.replace('/api', '')}/health`);
        if (healthResponse.ok) {
            console.log('✅ Server is running');
        } else {
            console.log('❌ Server health check failed');
            return;
        }

        // Test the test endpoint (this will help us debug)
        console.log('\n2. Testing candidate lookup endpoint...');
        const testResponse = await fetch(`${BASE_URL}/candidates/1/test`, {
            headers: {
                'Authorization': 'Bearer test-token', // This will fail auth, but we can see the response
                'Content-Type': 'application/json'
            }
        });

        console.log('Test endpoint status:', testResponse.status);
        const testData = await testResponse.text();
        console.log('Test endpoint response:', testData);

        console.log('\n3. Testing delete endpoint...');
        const deleteResponse = await fetch(`${BASE_URL}/candidates/1`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer test-token', // This will fail auth
                'Content-Type': 'application/json'
            }
        });

        console.log('Delete endpoint status:', deleteResponse.status);
        const deleteData = await deleteResponse.text();
        console.log('Delete endpoint response:', deleteData);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testDeleteAPI();