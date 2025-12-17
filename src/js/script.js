// Data Storage
        let products = JSON.parse(localStorage.getItem('magbaterias-products')) || [
            { id: 1, name: 'Bateria 60Ah Automotiva', category: 'Automotivo', price: 350.00, quantity: 15, minimum: 5, description: 'Bateria 60Ah para automóveis' },
            { id: 2, name: 'Bateria 100Ah Industrial', category: 'Industrial', price: 850.00, quantity: 8, minimum: 3, description: 'Bateria 100Ah para uso industrial' },
            { id: 3, name: 'Bateria Doméstica 12V', category: 'Doméstico', price: 450.00, quantity: 20, minimum: 5, description: 'Bateria 12V para uso doméstico' }
        ];

        let sales = JSON.parse(localStorage.getItem('magbaterias-sales')) || [];
        let cartItems = [];
        let editingProductId = null;

        // Initialize
        function init() {
            updateDate();
            renderInventory();
            renderProductSelect();
            updateDashboard();
            setupEventListeners();
            loadSalesHistory();
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const section = e.target.dataset.section;
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById(section).classList.add('active');
            });
        });

        // Update current date
        function updateDate() {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', options);
        }

        // Dashboard
        function updateDashboard() {
            const totalProducts = products.length;
            const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
            const lowStockCount = products.filter(p => p.quantity <= p.minimum).length;
            const criticalCount = products.filter(p => p.quantity === 0).length;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthSales = sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
            });

            const totalRevenue = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);

            document.getElementById('stat-products').textContent = totalProducts;
            document.getElementById('stat-quantity').textContent = totalQuantity;
            document.getElementById('stat-sales').textContent = monthSales.length;
            document.getElementById('stat-low-stock').textContent = lowStockCount;
            document.getElementById('stat-revenue').textContent = 'R$ ' + totalRevenue.toFixed(2).replace('.', ',');
            document.getElementById('stat-critical').textContent = criticalCount;

            // Low stock table
            const lowStockProducts = products.filter(p => p.quantity <= p.minimum);
            const tbody = document.getElementById('low-stock-body');
            tbody.innerHTML = '';

            if (lowStockProducts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-text-light);">Todos os produtos com estoque OK</td></tr>';
            } else {
                lowStockProducts.forEach(p => {
                    const status = p.quantity === 0 ? '🔴 Crítico' : '🟡 Baixo';
                    tbody.innerHTML += `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.quantity}</td>
                            <td>${p.minimum}</td>
                            <td><span class="badge ${p.quantity === 0 ? 'badge-danger' : 'badge-warning'}">${status}</span></td>
                        </tr>
                    `;
                });
            }
        }

        // Inventory Management
        function renderInventory() {
            const tbody = document.getElementById('inventory-body');
            tbody.innerHTML = '';

            products.forEach(p => {
                const status = p.quantity === 0 ? '🔴 Sem Estoque' : (p.quantity <= p.minimum ? '🟡 Baixo' : '🟢 OK');
                const statusClass = p.quantity === 0 ? 'danger' : (p.quantity <= p.minimum ? 'warning' : 'success');
                tbody.innerHTML += `
                    <tr>
                        <td>#${p.id}</td>
                        <td>${p.name}</td>
                        <td>${p.category}</td>
                        <td>R$ ${p.price.toFixed(2).replace('.', ',')}</td>
                        <td><strong>${p.quantity}</strong></td>
                        <td>${p.minimum}</td>
                        <td><span class="badge badge-${statusClass}">${status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.id})">✏️ Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">🗑️ Deletar</button>
                        </td>
                    </tr>
                `;
            });

            saveToStorage();
        }

        function renderProductSelect() {
            const select = document.getElementById('product-select');
            select.innerHTML = '<option value="">-- Selecione um produto --</option>';

            const availableProducts = products.filter(p => p.quantity > 0);
            availableProducts.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.name} (${p.quantity} disp.) - R$ ${p.price.toFixed(2).replace('.', ',')}</option>`;
            });
        }

        // Product Modal
        document.getElementById('add-product-btn').addEventListener('click', () => {
            editingProductId = null;
            document.getElementById('modal-title').textContent = 'Adicionar Produto';
            document.getElementById('product-form').reset();
            openModal('product-modal');
        });

        function editProduct(id) {
            const product = products.find(p => p.id === id);
            if (!product) return;

            editingProductId = id;
            document.getElementById('modal-title').textContent = 'Editar Produto';
            document.getElementById('form-product-name').value = product.name;
            document.getElementById('form-product-category').value = product.category;
            document.getElementById('form-product-price').value = product.price;
            document.getElementById('form-product-quantity').value = product.quantity;
            document.getElementById('form-product-minimum').value = product.minimum;
            document.getElementById('form-product-description').value = product.description || '';

            openModal('product-modal');
        }

        function deleteProduct(id) {
            if (!confirm('Tem certeza que deseja deletar este produto?')) return;
            products = products.filter(p => p.id !== id);
            renderInventory();
            renderProductSelect();
            updateDashboard();
        }

        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('form-product-name').value,
                category: document.getElementById('form-product-category').value,
                price: parseFloat(document.getElementById('form-product-price').value),
                quantity: parseInt(document.getElementById('form-product-quantity').value),
                minimum: parseInt(document.getElementById('form-product-minimum').value),
                description: document.getElementById('form-product-description').value
            };

            if (editingProductId) {
                const product = products.find(p => p.id === editingProductId);
                Object.assign(product, formData);
            } else {
                const newId = Math.max(...products.map(p => p.id), 0) + 1;
                products.push({ id: newId, ...formData });
            }

            renderInventory();
            renderProductSelect();
            updateDashboard();
            closeModal('product-modal');
            showAlert('Produto salvo com sucesso!', 'success');
        });

        // Shopping Cart
        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            const productId = parseInt(document.getElementById('product-select').value);
            const quantity = parseInt(document.getElementById('quantity-input').value);

            if (!productId || !quantity) {
                showAlert('Selecione um produto e quantidade válida', 'warning');
                return;
            }

            const product = products.find(p => p.id === productId);
            if (!product || product.quantity < quantity) {
                showAlert('Quantidade insuficiente em estoque', 'error');
                return;
            }

            const existingItem = cartItems.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cartItems.push({
                    id: productId,
                    name: product.name,
                    price: product.price,
                    quantity: quantity
                });
            }

            document.getElementById('product-select').value = '';
            document.getElementById('quantity-input').value = '1';
            renderCart();
            showAlert('Produto adicionado ao carrinho!', 'success');
        });

        function renderCart() {
            const tbody = document.getElementById('cart-body');
            const emptyMsg = document.getElementById('empty-cart-message');

            tbody.innerHTML = '';

            if (cartItems.length === 0) {
                emptyMsg.style.display = 'block';
            } else {
                emptyMsg.style.display = 'none';
                cartItems.forEach((item, index) => {
                    const subtotal = item.price * item.quantity;
                    tbody.innerHTML += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
                            <td>R$ ${subtotal.toFixed(2).replace('.', ',')}</td>
                            <td><button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">Remover</button></td>
                        </tr>
                    `;
                });
            }

            updateCartSummary();
        }

        function removeFromCart(index) {
            cartItems.splice(index, 1);
            renderCart();
        }

        document.getElementById('cancel-sale-btn').addEventListener('click', () => {
            if (confirm('Limpar todo o carrinho?')) {
                cartItems = [];
                renderCart();
            }
        });

        function updateCartSummary() {
            const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discountPercent = parseFloat(document.getElementById('discount-input').value) || 0;
            const discountValue = subtotal * (discountPercent / 100);
            const total = subtotal - discountValue;

            document.getElementById('summary-subtotal').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
            document.getElementById('summary-discount').textContent = 'R$ ' + discountValue.toFixed(2).replace('.', ',');
            document.getElementById('summary-total').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
        }

        document.getElementById('discount-input').addEventListener('change', updateCartSummary);

        // Finalize Sale
        document.getElementById('finalize-sale-btn').addEventListener('click', () => {
            const customerName = document.getElementById('customer-name').value.trim();
            const customerDocument = document.getElementById('customer-document').value.trim();

            if (!customerName) {
                showAlert('Digite o nome do cliente', 'warning');
                return;
            }

            if (cartItems.length === 0) {
                showAlert('Adicione itens ao carrinho', 'warning');
                return;
            }

            const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discountPercent = parseFloat(document.getElementById('discount-input').value) || 0;
            const discountValue = subtotal * (discountPercent / 100);
            const total = subtotal - discountValue;

            const saleId = 'VND-' + Date.now();
            const sale = {
                id: saleId,
                date: new Date().toISOString(),
                customer: customerName,
                document: customerDocument,
                items: [...cartItems],
                subtotal: subtotal,
                discount: discountValue,
                total: total
            };

            // Update inventory
            cartItems.forEach(item => {
                const product = products.find(p => p.id === item.id);
                if (product) {
                    product.quantity -= item.quantity;
                }
            });

            sales.push(sale);
            saveToStorage();
            showSaleDetails(sale);
            clearSale();
            updateDashboard();
            renderInventory();
            renderProductSelect();
        });

        function clearSale() {
            cartItems = [];
            document.getElementById('customer-name').value = '';
            document.getElementById('customer-document').value = '';
            document.getElementById('discount-input').value = '0';
            renderCart();
        }

        function showSaleDetails(sale) {
            const content = document.getElementById('sale-details-content');
            const itemsHtml = sale.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
                    <td>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</td>
                </tr>
            `).join('');

            content.innerHTML = `
                <div style="background: var(--color-bg); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md);">
                    <p><strong>ID da Venda:</strong> ${sale.id}</p>
                    <p><strong>Cliente:</strong> ${sale.customer}</p>
                    ${sale.document ? `<p><strong>CPF/CNPJ:</strong> ${sale.document}</p>` : ''}
                    <p><strong>Data/Hora:</strong> ${new Date(sale.date).toLocaleString('pt-BR')}</p>
                </div>
                <table style="width: 100%; margin-bottom: var(--spacing-md);">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: var(--spacing-sm);">Produto</th>
                            <th style="text-align: right; padding: var(--spacing-sm);">Qty</th>
                            <th style="text-align: right; padding: var(--spacing-sm);">Preço</th>
                            <th style="text-align: right; padding: var(--spacing-sm);">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div style="border-top: 2px solid var(--color-border); padding-top: var(--spacing-md); text-align: right;">
                    <p style="margin: var(--spacing-sm) 0;"><strong>Subtotal:</strong> R$ ${sale.subtotal.toFixed(2).replace('.', ',')}</p>
                    ${sale.discount > 0 ? `<p style="margin: var(--spacing-sm) 0;"><strong>Desconto:</strong> -R$ ${sale.discount.toFixed(2).replace('.', ',')}</p>` : ''}
                    <p style="margin: var(--spacing-sm) 0; font-size: 18px;"><strong>Total: R$ ${sale.total.toFixed(2).replace('.', ',')}</strong></p>
                </div>
            `;

            window.currentSale = sale;
            openModal('sale-details-modal');
        }

        // Sales History
        function loadSalesHistory() {
            renderHistory();
        }

        function renderHistory() {
            const tbody = document.getElementById('history-body');
            const emptyMsg = document.getElementById('empty-history-message');

            tbody.innerHTML = '';

            if (sales.length === 0) {
                emptyMsg.style.display = 'block';
            } else {
                emptyMsg.style.display = 'none';
                sales.forEach(sale => {
                    const itemCount = sale.items.length;
                    const itemsText = sale.items.map(i => i.name).join(', ');
                    tbody.innerHTML += `
                        <tr>
                            <td>${sale.id}</td>
                            <td>${new Date(sale.date).toLocaleString('pt-BR')}</td>
                            <td>${sale.customer}</td>
                            <td title="${itemsText}">${itemCount} item(ns)</td>
                            <td>R$ ${sale.total.toFixed(2).replace('.', ',')}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewSaleDetail('${sale.id}')">👁️ Ver</button>
                                <button class="btn btn-sm btn-secondary" onclick="generateInvoicePDF('${sale.id}')">📄 PDF</button>
                            </td>
                        </tr>
                    `;
                });
            }
        }

        function viewSaleDetail(saleId) {
            const sale = sales.find(s => s.id === saleId);
            if (sale) {
                showSaleDetails(sale);
            }
        }

        // PDF Generation
        function generateInvoicePDF(saleId) {
            const sale = sales.find(s => s.id === saleId);
            if (!sale) return;

            window.currentSale = sale;
            generatePDF();
        }

        function generatePDF() {
            const sale = window.currentSale;
            if (!sale) return;

            const element = document.createElement('div');
            element.style.padding = '20px';
            element.style.fontFamily = 'Arial, sans-serif';
            element.style.backgroundColor = 'white';

            const date = new Date(sale.date);
            const itemsHtml = sale.items.map(item => `
                <tr>
                    <td style="border-bottom: 1px solid #ddd; padding: 10px; text-align: left;">${item.name}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 10px; text-align: right;">R$ ${item.price.toFixed(2).replace('.', ',')}</td>
                    <td style="border-bottom: 1px solid #ddd; padding: 10px; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</td>
                </tr>
            `).join('');

            element.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0891b2; padding-bottom: 20px;">
                    <h1 style="margin: 0; color: #0891b2;">🔋 MagBaterias</h1>
                    <p style="margin: 5px 0; color: #666;">NOTA FISCAL ELETRÔNICA</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <p style="margin: 5px 0;"><strong>ID da Venda:</strong> ${sale.id}</p>
                    <p style="margin: 5px 0;"><strong>Data:</strong> ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}</p>
                </div>

                <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background: #f9f9f9;">
                    <h3 style="margin: 0 0 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">CLIENTE</h3>
                    <p style="margin: 5px 0;"><strong>Nome:</strong> ${sale.customer}</p>
                    ${sale.document ? `<p style="margin: 5px 0;"><strong>CPF/CNPJ:</strong> ${sale.document}</p>` : ''}
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f0f0f0; border-bottom: 2px solid #0891b2;">
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descrição do Produto</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Quantidade</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Valor Unitário</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; border-top: 2px solid #0891b2; padding-top: 15px;">
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Subtotal:</strong> R$ ${sale.subtotal.toFixed(2).replace('.', ',')}</p>
                    ${sale.discount > 0 ? `<p style="margin: 5px 0; font-size: 16px;"><strong>Desconto:</strong> -R$ ${sale.discount.toFixed(2).replace('.', ',')}</p>` : ''}
                    <p style="margin: 10px 0; font-size: 20px; color: #0891b2; font-weight: bold;">TOTAL: R$ ${sale.total.toFixed(2).replace('.', ',')}</p>
                </div>

                <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; color: #666; font-size: 12px;">
                    <p>Obrigado pela compra!</p>
                    <p>MagBaterias - Sistema de Gestão de Estoque v2.0</p>
                    <p>Emitido em ${new Date().toLocaleString('pt-BR')}</p>
                </div>
            `;

            const options = {
                margin: 10,
                filename: `nfe-magbaterias-${sale.id}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };

            html2pdf().set(options).from(element).save();
        }

        // Export CSV
        document.getElementById('export-history-btn').addEventListener('click', () => {
            if (sales.length === 0) {
                showAlert('Nenhuma venda para exportar', 'warning');
                return;
            }

            let csv = 'ID Venda,Data,Cliente,CPF/CNPJ,Quantidade de Produtos,Subtotal,Desconto,Total\n';

            sales.forEach(sale => {
                csv += `"${sale.id}","${new Date(sale.date).toLocaleString('pt-BR')}","${sale.customer}","${sale.document}","${sale.items.length}","R$ ${sale.subtotal.toFixed(2)}","R$ ${sale.discount.toFixed(2)}","R$ ${sale.total.toFixed(2)}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'magbaterias-vendas-' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
        });

        // Filter History
        document.getElementById('filter-history-btn').addEventListener('click', () => {
            const startDate = new Date(document.getElementById('filter-date-start').value);
            const endDate = new Date(document.getElementById('filter-date-end').value);
            const searchTerm = document.getElementById('search-history').value.toLowerCase();

            const filtered = sales.filter(sale => {
                const saleDate = new Date(sale.date);
                const matchDate = (!document.getElementById('filter-date-start').value || saleDate >= startDate) &&
                                (!document.getElementById('filter-date-end').value || saleDate <= endDate);
                const matchSearch = !searchTerm || sale.customer.toLowerCase().includes(searchTerm);
                return matchDate && matchSearch;
            });

            const tbody = document.getElementById('history-body');
            tbody.innerHTML = '';

            if (filtered.length === 0) {
                document.getElementById('empty-history-message').style.display = 'block';
            } else {
                document.getElementById('empty-history-message').style.display = 'none';
                filtered.forEach(sale => {
                    const itemCount = sale.items.length;
                    tbody.innerHTML += `
                        <tr>
                            <td>${sale.id}</td>
                            <td>${new Date(sale.date).toLocaleString('pt-BR')}</td>
                            <td>${sale.customer}</td>
                            <td>${itemCount} item(ns)</td>
                            <td>R$ ${sale.total.toFixed(2).replace('.', ',')}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewSaleDetail('${sale.id}')">👝 Ver</button>
                                <button class="btn btn-sm btn-secondary" onclick="generateInvoicePDF('${sale.id}')">📄 PDF</button>
                            </td>
                        </tr>
                    `;
                });
            }
        });

        // Reports
        function updateReports() {
            const startDate = new Date(document.getElementById('report-start-date').value);
            const endDate = new Date(document.getElementById('report-end-date').value);

            let filteredSales = sales;

            if (document.getElementById('report-start-date').value) {
                filteredSales = filteredSales.filter(s => new Date(s.date) >= startDate);
            }

            if (document.getElementById('report-end-date').value) {
                filteredSales = filteredSales.filter(s => new Date(s.date) <= endDate);
            }

            const totalSales = filteredSales.length;
            const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
            const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

            document.getElementById('report-total-sales').textContent = totalSales;
            document.getElementById('report-total-revenue').textContent = 'R$ ' + totalRevenue.toFixed(2).replace('.', ',');
            document.getElementById('report-avg-ticket').textContent = 'R$ ' + avgTicket.toFixed(2).replace('.', ',');

            // Products sold
            const productStats = {};
            filteredSales.forEach(sale => {
                sale.items.forEach(item => {
                    if (!productStats[item.id]) {
                        productStats[item.id] = { name: item.name, quantity: 0, revenue: 0 };
                    }
                    productStats[item.id].quantity += item.quantity;
                    productStats[item.id].revenue += item.price * item.quantity;
                });
            });

            const reportBody = document.getElementById('report-body');
            reportBody.innerHTML = '';

            Object.values(productStats).sort((a, b) => b.quantity - a.quantity).forEach(stat => {
                const avgPrice = stat.quantity > 0 ? stat.revenue / stat.quantity : 0;
                reportBody.innerHTML += `
                    <tr>
                        <td>${stat.name}</td>
                        <td>${stat.quantity}</td>
                        <td>R$ ${stat.revenue.toFixed(2).replace('.', ',')}</td>
                        <td>R$ ${avgPrice.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            });
        }

        document.getElementById('report-start-date').addEventListener('change', updateReports);
        document.getElementById('report-end-date').addEventListener('change', updateReports);

        // Search and Filter Inventory
        document.getElementById('search-inventory').addEventListener('keyup', filterInventory);
        document.getElementById('filter-category').addEventListener('change', filterInventory);

        function filterInventory() {
            const searchTerm = document.getElementById('search-inventory').value.toLowerCase();
            const category = document.getElementById('filter-category').value;

            const tbody = document.getElementById('inventory-body');
            tbody.innerHTML = '';

            const filtered = products.filter(p => {
                const matchSearch = p.name.toLowerCase().includes(searchTerm);
                const matchCategory = !category || p.category === category;
                return matchSearch && matchCategory;
            });

            filtered.forEach(p => {
                const status = p.quantity === 0 ? '🔴 Sem Estoque' : (p.quantity <= p.minimum ? '🟡 Baixo' : '🟢 OK');
                const statusClass = p.quantity === 0 ? 'danger' : (p.quantity <= p.minimum ? 'warning' : 'success');
                tbody.innerHTML += `
                    <tr>
                        <td>#${p.id}</td>
                        <td>${p.name}</td>
                        <td>${p.category}</td>
                        <td>R$ ${p.price.toFixed(2).replace('.', ',')}</td>
                        <td><strong>${p.quantity}</strong></td>
                        <td>${p.minimum}</td>
                        <td><span class="badge badge-${statusClass}">${status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.id})">✏️ Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">🗑️ Deletar</button>
                        </td>
                    </tr>
                `;
            });
        }

        // Modals
        function openModal(id) {
            document.getElementById(id).classList.add('active');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });

        // Alert
        function showAlert(message, type = 'info') {
            const alertContainer = document.getElementById('alert-container');
            const alert = document.createElement('div');
            alert.className = `alert show alert-${type}`;
            alert.textContent = message;
            alertContainer.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 3000);
        }

        // Storage
        function saveToStorage() {
            localStorage.setItem('magbaterias-products', JSON.stringify(products));
            localStorage.setItem('magbaterias-sales', JSON.stringify(sales));
        }

        function setupEventListeners() {
            // Any additional event listeners
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', init);