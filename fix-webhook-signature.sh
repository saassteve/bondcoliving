#!/bin/bash

# Stripe Webhook Signature Fix - Quick Deploy Script
# Run this after setting STRIPE_WEBHOOK_SECRET in Supabase Dashboard

echo "=========================================="
echo "Stripe Webhook Signature Fix"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
else
    echo "✅ Supabase CLI is installed"
fi

echo ""
echo "Step 1: Login to Supabase"
echo "=========================================="
supabase login

echo ""
echo "Step 2: Link to your project"
echo "=========================================="
supabase link --project-ref eaccyitssgrkrrqgdojy

echo ""
echo "Step 3: Deploy stripe-webhook function"
echo "=========================================="
supabase functions deploy stripe-webhook

echo ""
echo "Step 4: Verify deployment"
echo "=========================================="
supabase functions list

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Create a fresh test booking (don't resend old events)"
echo "2. Complete the Stripe checkout"
echo "3. Verify webhook succeeds in Stripe Dashboard"
echo "4. Check Edge Function logs in Supabase Dashboard"
echo ""
echo "For manual processing of the current pending booking,"
echo "see: fix-pending-booking.sql"
echo ""
