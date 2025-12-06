#!/bin/bash

# AdminCoworkingPage.tsx
sed -i 's/bg-gray-700 text-gray-300 hover:bg-gray-200/bg-gray-700 text-gray-300 hover:bg-gray-600/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-green-100 text-green-800/bg-green-900\/50 text-green-300 border border-green-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-yellow-100 text-yellow-800/bg-yellow-900\/50 text-yellow-300 border border-yellow-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-red-100 text-red-800/bg-red-900\/50 text-red-300 border border-red-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-blue-100 text-blue-800/bg-blue-900\/50 text-blue-300 border border-blue-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-gray-100 text-gray-800/bg-gray-700\/50 text-gray-300 border border-gray-600/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-purple-100 text-purple-800/bg-purple-900\/50 text-purple-300 border border-purple-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-green-600 text-white/bg-green-600 text-white hover:bg-green-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-yellow-600 text-white/bg-yellow-600 text-white hover:bg-yellow-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-red-600 text-white/bg-red-600 text-white hover:bg-red-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-blue-600 text-white hover:bg-blue-700/bg-indigo-600 text-white hover:bg-indigo-700/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/text-primary-600 hover:text-primary-800/text-indigo-400 hover:text-indigo-300/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/text-red-600 hover:text-red-800/text-red-400 hover:text-red-300/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-primary-600 text-white/bg-indigo-600 text-white/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-green-100 text-green-800 hover:bg-green-200/bg-green-900\/50 text-green-300 border border-green-700 hover:bg-green-900\/70/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-yellow-100 text-yellow-800 hover:bg-yellow-200/bg-yellow-900\/50 text-yellow-300 border border-yellow-700 hover:bg-yellow-900\/70/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/bg-red-100 text-red-800 hover:bg-red-200/bg-red-900\/50 text-red-300 border border-red-700 hover:bg-red-900\/70/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/text-gray-500 hover:text-gray-300/text-gray-400 hover:text-gray-200/g' src/pages/admin/AdminCoworkingPage.tsx
sed -i 's/hover:bg-gray-700"/hover:bg-gray-600"/g' src/pages/admin/AdminCoworkingPage.tsx

echo "Coworking page fixed!"
