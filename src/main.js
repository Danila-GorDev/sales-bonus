/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции

   const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге

    if (index === 0) return seller.profit * 0.15;
    if (index === 1 || index === 2) return seller.profit * 0.10;
    if (index === total - 1) return 0;
    return seller.profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers) || data.sellers.length === 0 
        || !Array.isArray(data.products) || data.products.length === 0 
        || !Array.isArray(data.products) || data.products.length === 0 
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций

    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Не функции');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));

    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));



    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count++;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            seller.revenue += revenue;
            const itemProfit = revenue - cost;
            seller.profit += itemProfit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => {
        if (b.profit !== a.profit) return b.profit - a.profit;
        return a.id.localeCompare(b.id);
    });

    // @TODO: Назначение премий на основе ранжирования

    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => {
                if (b.quantity !== a.quantity) return b.quantity - a.quantity;
                return a.sku.localeCompare(b.sku);
            })
            .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

     return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: Math.round(seller.revenue * 100) / 100,
        profit: Math.round(seller.profit * 100) / 100,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: Math.round(seller.bonus * 100) / 100
    }));
}

    