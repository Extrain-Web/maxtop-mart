const mongoose = require('mongoose');
mongoose.connect('mongodb://root:AgJfPMKMYUJOnDmgHsGnTroEemY0R2bSrqYs0r91lkct6xYlnW0qo6M1Ka6i51W9@84.46.254.65:27019/maxtopmart?authSource=admin&directConnection=true')
  .then(async () => {
    try {
      const db = mongoose.connection.db;
      // Update all parent categories (parent is null or not exists)
      const parentResult = await db.collection('categories').updateMany(
        { $or: [{ parent: null }, { parent: { $exists: false } }] },
        { $set: { icon: '📦' }, $unset: { description: '' } }
      );
      console.log('Parent categories updated:', parentResult.modifiedCount);

      // Update all subcategories (parent exists and is not null)
      const subResult = await db.collection('categories').updateMany(
        { parent: { $ne: null, $exists: true } },
        { $set: { icon: '🏷️' }, $unset: { description: '' } }
      );
      console.log('Sub-categories updated:', subResult.modifiedCount);

      process.exit(0);
    } catch(e) {
      console.error(e);
      process.exit(1);
    }
  });
