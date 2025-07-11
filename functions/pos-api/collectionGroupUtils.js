// שליפת orders עם products ו-collectionGroupProducts עבור collectionGroupId
const getCollectionOrdersAndGroupProducts = async (collectionGroupId) => {
    // שליפת orderProducts
    const orderProductsSnap = await db.collection('orderProducts')
        .where('collectionGroupId', '==', collectionGroupId)
        .get();
    const orderProducts = orderProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // שליפת orders
    const ordersSnap = await db.collection('orders')
        .where('collectionGroupId', '==', collectionGroupId)
        .get();
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // שליפת collectionGroupProducts
    const groupProductsSnap = await db.collection('collectionGroupProducts')
        .where('collectionGroupId', '==', collectionGroupId)
        .get();
    const collectionGroupProducts = groupProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // productsByOrderId
    const productsByOrderId = orderProducts.reduce((acc, product) => {
        if (!acc[product.orderId]) acc[product.orderId] = [];
        acc[product.orderId].push(product);
        return acc;
    }, {});

    // ordersWithProducts
    const ordersWithProducts = orders.map(order => ({
        ...order,
        products: productsByOrderId[order.id] || []
    })).sort((a, b) => {
        const aOrder = a.collectionGroupOrder || 0;
        const bOrder = b.collectionGroupOrder || 0;
        return aOrder - bOrder;
    });

    return { ordersWithProducts, collectionGroupProducts, orderProducts };
};

module.exports.getCollectionOrdersAndGroupProducts = getCollectionOrdersAndGroupProducts;
