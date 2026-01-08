// UI Utilities
const UI = {
    showStatus(message, type) {
        const statusBar = document.getElementById('statusBar');
        statusBar.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-green-100', 'text-green-800', 'bg-blue-100', 'text-blue-800');

        if (type === 'error') {
            statusBar.classList.add('bg-red-100', 'text-red-800');
        } else if (type === 'success') {
            statusBar.classList.add('bg-green-100', 'text-green-800');
        } else {
            statusBar.classList.add('bg-blue-100', 'text-blue-800');
        }

        statusBar.textContent = message;
        statusBar.classList.add('fade-in');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (statusBar.textContent === message) {
                statusBar.classList.add('hidden');
            }
        }, 5000);
    },

    createCard(title, content, className = '') {
        return `
            <div class="bg-white rounded-lg p-4 shadow-md card-hover fade-in ${className}">
                ${title ? `<div class="text-gray-500 text-sm mb-1">${title}</div>` : ''}
                <div class="text-2xl font-bold text-gray-800">${content}</div>
            </div>
        `;
    },

    createInput(id, placeholder, type = 'text', value = '') {
        return `<input type="${type}" id="${id}" placeholder="${placeholder}" value="${value}" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">`;
    },

    createSelect(id, options, label = '') {
        const optionsHtml = options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        
        return `
            ${label ? `<label class="block text-sm font-medium mb-2">${label}</label>` : ''}
            <select id="${id}" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                ${optionsHtml}
            </select>
        `;
    },

    createButton(text, onclick, className = 'bg-blue-600 hover:bg-blue-700') {
        const id = 'btn_' + Math.random().toString(36).substr(2, 9);
        setTimeout(() => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = onclick;
        }, 0);
        
        return `<button id="${id}" class="${className} text-white py-3 px-6 rounded-lg font-semibold transition-all w-full">${text}</button>`;
    },

    createTokenSelect(id, label = 'Select Token') {
        const tokens = Object.keys(CONFIG.TOKENS).map(symbol => ({
            value: symbol,
            label: symbol
        }));
        return this.createSelect(id, tokens, label);
    },

    createAddressInput(id, placeholder = 'Enter Address') {
        return this.createInput(id, placeholder, 'text');
    },

    createAmountInput(id, placeholder = 'Amount', defaultValue = '1') {
        return this.createInput(id, placeholder, 'number', defaultValue);
    },

    getInputValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    },

    setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    },

    showLoading(elementId, message = 'Loading...') {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                    <span class="text-gray-600">${message}</span>
                </div>
            `;
        }
    },

    clearLoading(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = '';
    }
};