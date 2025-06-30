/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет прибыли от операции

  // Рассчитываем коэффициент скидки
    const discount = 1 - (purchase.discount / 100);
    
    // Рассчитываем выручку с учётом скидки
    const revenue = purchase.sale_price * purchase.quantity * discount;

  return revenue;
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
    const profit = seller.profit;
    
    // Проверяем условия и рассчитываем бонус
    if (index === 0) { // Первый место (индекс 0)
        return profit * 0.15; // 15% от прибыли
    } else if (index === 1 || index === 2) { // Второе или третье место
        return profit * 0.10; // 10% от прибыли
    } else if (index === total - 1) { // Последнее место
        return 0; // Бонус отсутствует
    } else { // Все остальные позиции
        return profit * 0.05; // 5% от прибыли
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !options ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций

  const { calculateRevenue, calculateBonus } = options;
  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Не функции");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

    console.log(sellerStats);

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  );

  const productIndex = Object.fromEntries(
   data.products.map((item) => [item.sku, item])
  );
    
    console.log(sellerIndex);
    console.log(productIndex);

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count++;
    
    seller.revenue += record.total_amount;
    

    record.items.forEach((item) => {

      const product = productIndex[item.sku];
      if (!product) return;

      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item);
      const profit = revenue - cost;
      seller.profit += profit;

      //seller.total_quantity += item.quantity;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
        seller.products_sold[item.sku] += item.quantity;
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


  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity })) // Преобразуем в массив объектов {sku, quantity}
        .sort((a, b) => b.quantity - a.quantity) // Сортируем по убыванию quantity
        .slice(0, 10); // Оставляем первые 10 элементов
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: parseFloat(seller.revenue.toFixed(2)),
    profit: parseFloat(seller.profit.toFixed(2)),
    sales_count: Math.round(seller.sales_count),
    top_products: seller.top_products,
    bonus: parseFloat(seller.bonus.toFixed(2))
  }));
}
