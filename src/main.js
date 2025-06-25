/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции

    // Разрушаем объект purchase, получая необходимые параметры
    const { discount, sale_price, quantity } = purchase;
    
    // Расчет базовой выручки без учета скидки
    const baseRevenue = purchase.sale_price * purchase.quantity;
    
    // Расчет суммы скидки
    const discountAmount = baseRevenue * (purchase.discount / 100);
    
    // Расчет итоговой выручки с учетом скидки
    const finalRevenue = baseRevenue - discountAmount;
    
    return finalRevenue;
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

    // Извлекаем прибыль продавца
   const { profit } = seller;
   
   // Определяем процент бонуса в зависимости от позиции в рейтинге
   const bonusPercentage = determineBonusPercentage(index, total);
   
   // Рассчитываем сумму бонуса
   const bonusAmount = calculateBonusAmount(profit, bonusPercentage);
   
   return bonusAmount;
}

function determineBonusPercentage(index, total) {
   // Определяем процент бонуса в зависимости от позиции
   if (index < total * 0.2) {
      return 0.15; // 15% для топ-20% продавцов
   } else if (index < total * 0.5) {
      return 0.10; // 10% для следующих 30%
   } else {
      return 0.05; // 5% для остальных
   }
}

function calculateBonusAmount(profit, percentage) {
   // Рассчитываем сумму бонуса как процент от прибыли
   return profit * percentage;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data || !options
        || !Array.isArray(data.sellers) || data.sellers.length === 0 
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
            const revenue = calculateRevenue(item);
            seller.revenue += revenue;
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
        }

            seller.products_sold[item.sku].count += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => {
         if (a.profit !== b.profit) {
        return b.profit - a.profit;
    }
    // При равной прибыли сортируем по выручке
    if (a.revenue !== b.revenue) {
        return b.revenue - a.revenue;
    }
    
    // При равных показателях сортируем по количеству продаж
    return b.sales_count - a.sales_count;
    });

    // @TODO: Назначение премий на основе ранжирования

    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
        seller.top_products = seller.top_products = getTopProducts(seller.products_sold);
});
    
    
    function getTopProducts(products_sold) {
    // Преобразуем объект в массив и сортируем по выручке
    const productsArray = Object.entries(products_sold).map(([sku, stats]) => ({
        sku: sku,
        count: stats.count,
        total_revenue: stats.total_revenue,
        total_profit: stats.total_profit
    }));

    // Сортируем по убыванию выручки
    productsArray.sort((a, b) => b.total_revenue - a.total_revenue);

    // Возвращаем топ-10 товаров
    return productsArray.slice(0, 10);
}


    // @TODO: Подготовка итоговой коллекции с нужными полями

     return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: parseFloat(seller.revenue.toFixed(2)),
         profit: parseFloat(seller.profit.toFixed(2)),
        sales_count: Math.round(seller.sales_count),
        top_products: seller.top_products,
        bonus: parseFloat(seller.bonus.toFixed(2))
    }));
}

    