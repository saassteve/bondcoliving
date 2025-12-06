#!/bin/bash

# AdminAccountPage.tsx - Already mostly dark but need a few fixes
sed -i 's/border-red-300/border-gray-600/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-gray-50/bg-gray-700\/50/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/text-gray-500\b/text-gray-400/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-red-50 text-red-700/bg-red-900\/30 text-red-300 border border-red-700/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-purple-100 text-purple-800/bg-purple-900\/50 text-purple-300 border border-purple-700/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-blue-100 text-blue-800/bg-blue-900\/50 text-blue-300 border border-blue-700/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-green-100 text-green-800/bg-green-900\/50 text-green-300 border border-green-700/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-red-100 text-red-800/bg-red-900\/50 text-red-300 border border-red-700/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-indigo-100 flex/bg-indigo-900\/30 flex/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/text-indigo-600/text-indigo-400/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/divide-y divide-gray-600/divide-y divide-gray-700/g' src/pages/admin/AdminAccountPage.tsx
sed -i 's/bg-white divide-y/bg-gray-800 divide-y/g' src/pages/admin/AdminAccountPage.tsx

# AdminPromotionsPage - mostly done but fix a few items
sed -i 's/bg-gray-700 text-gray-300 hover:bg-gray-200/bg-gray-700 text-gray-300 hover:bg-gray-600/g' src/pages/admin/AdminPromotionsPage.tsx

echo "Account and Promotions pages fixed!"
