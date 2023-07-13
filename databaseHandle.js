const {ObjectId,MongoClient} = require('mongodb');
const URL = 'mongodb://0.0.0.0:27017';

async function getDB() {
    const client = await MongoClient.connect(URL)
    const dbo = client.db('News');
    return dbo;
}
async function insertObject(collectionName, objectToInsert) {
    const dbo = await getDB();
    await dbo.collection(collectionName).insertOne(objectToInsert);
}
async function DeleteObject(id){
    const db = await getDB();
    await db.collection("toys").deleteOne({_id:ObjectId(id)});
}

async function getRole(name, pass) {
    const db = await getDB()
    const user = await db.collection('Account').findOne({'username':name, 'password':pass});
    if (user == null) {
        return "-1"
    } else {
        console.log(user);
        return user.role
    }
}

module.exports = {getDB,insertObject,getRole,ObjectId};