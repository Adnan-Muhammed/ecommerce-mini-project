const CategoryDB = require('../models/category');

const fetchCategories = async () => {
    try {
        const category = await CategoryDB.find();
        const uniqueCategories = category
            .filter(categorydata => categorydata.isAvailable)
            .map(categorydata => categorydata.name);

        const primaryCategories = uniqueCategories.filter(categorydata => ['MEN', 'WOMEN', 'KIDS'].includes(categorydata));
        const otherCategories = uniqueCategories.filter(categorydata => !['MEN', 'WOMEN', 'KIDS'].includes(categorydata));

        return { primaryCategories, otherCategories };
    } catch (err) {
        console.error(err);
        throw new Error('Error fetching categories');
    }
};

module.exports = { fetchCategories };
