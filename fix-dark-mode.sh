#!/bin/bash

# AdminLocalInfoPage.tsx
sed -i 's/text-3xl font-bold text-gray-900/text-3xl font-bold text-white/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-gray-600">Manage local guides/text-gray-300">Manage local guides/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-blue-600 text-white rounded-lg hover:bg-blue-700/bg-indigo-600 text-white rounded-lg hover:bg-indigo-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/border-b-2 border-blue-600/border-b-2 border-indigo-600/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-blue-600 text-white/bg-indigo-600 text-white/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-gray-100 text-gray-700 hover:bg-gray-200/bg-gray-700 text-gray-200 hover:bg-gray-600/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-white rounded-xl shadow-sm p-12 text-center/bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-xl font-semibold text-gray-900/text-xl font-semibold text-white/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-gray-600 mb-6/text-gray-300 mb-6/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-white rounded-xl shadow-sm p-6"/bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700"/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-xl font-bold text-gray-900/text-xl font-bold text-white/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-gray-600 whitespace-pre-wrap/text-gray-300 whitespace-pre-wrap/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/hover:bg-gray-100 rounded-lg/hover:bg-gray-700 rounded-lg/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-gray-600"/text-gray-300"/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-blue-600"/text-indigo-400"/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-red-600"/text-red-400"/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-opacity-50 flex items-center justify-center p-4 z-50/bg-opacity-75 flex items-center justify-center p-4 z-50/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-\[90vh\]/bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] border border-gray-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-2xl font-bold text-gray-900/text-2xl font-bold text-white/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-sm font-medium text-gray-700 mb-2/text-sm font-medium text-gray-300 mb-2/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50/border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/text-blue-600 rounded focus:ring-blue-500/text-indigo-600 rounded focus:ring-indigo-500/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-orange-100 text-orange-700/bg-orange-900\/50 text-orange-300 border border-orange-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-purple-100 text-purple-700/bg-purple-900\/50 text-purple-300 border border-purple-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-blue-100 text-blue-700/bg-blue-900\/50 text-blue-300 border border-blue-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-green-100 text-green-700/bg-green-900\/50 text-green-300 border border-green-700/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-gray-100 text-gray-700/bg-gray-700\/50 text-gray-300 border border-gray-600/g' src/pages/admin/AdminLocalInfoPage.tsx
sed -i 's/bg-red-100 text-red-700/bg-red-900\/50 text-red-300 border border-red-700/g' src/pages/admin/AdminLocalInfoPage.tsx

echo "Dark mode fixes applied!"
