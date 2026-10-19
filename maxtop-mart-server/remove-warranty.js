const mongoose = require('mongoose');
mongoose.connect('mongodb://root:AgJfPMKMYUJOnDmgHsGnTroEemY0R2bSrqYs0r91lkct6xYlnW0qo6M1Ka6i51W9@84.46.254.65:27019/maxtopmart?authSource=admin&directConnection=true')
  .then(async () => {
    try {
      const db = mongoose.connection.db;
      const result = await db.collection('products').updateMany(
        {},
        { $unset: { warranty: '' } }
      );
      console.log('Successfully unset warranty from products:', result.modifiedCount);
    } catch (err) {
      console.error('Error updating products:', err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(console.error);
