const { googleBooksApiKey } = require('./vars.json');
const axios = require('axios');
const fs = require('fs');

const readFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.readFile(...args, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}

const getBookInfo = async (title) => {
    const { data } = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${title}`).catch(error => console.log(error));
    return data;
}

const appendFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.appendFile(...args, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        })
    })
}

(async () => {
    const rawBookData = await readFile('./books.tsv', 'utf8').catch(error => console.log(error));
    const books = rawBookData.split('\n').splice(1, rawBookData.length - 1).map(item => {
        const row = item.replace(/,|"|'/g, '').split('\t');
        return {
            description: row[2],
            title: row[3],
            author: row[4]
        };
    });
    const promises = books.map(async (book, index) => {
        const info = await getBookInfo(book.title).catch(err => console.log(err));
        const saleInfo = info.items.find(item => {
            if (item.saleInfo) {
                return item.saleInfo.saleability === 'FOR_SALE';
            }
        });
        return {
            ...book,
            price: saleInfo ? saleInfo.saleInfo.listPrice.amount : "unknown",
            url: saleInfo ? saleInfo.saleInfo.buyLink : "unknown"
        }
    });
    const results = await Promise.all(promises);
    for (let i = 0; i < results.length; i++) {
        if (i === 0) {
            const firstRow = 'Title,Author,Price,Url,Description'
            await appendFile('test.csv', firstRow, 'utf8').catch(err => console.log(err));
        }
        const { title, author, price, url, description } = results[i];
        const csvString = `\n${title}, ${author}, ${price}, ${url}, ${description} `
        await appendFile('test.csv', csvString, 'utf8').catch(err => console.log(err));
    }
})();
