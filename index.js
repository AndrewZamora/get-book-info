const { googleBooksApiKey } = require('./vars.json');
const axios = require('axios');
const getBookInfo = async (title) => {
    const { data } = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${title}`).catch(error => console.log(error));
    return data;
}

(async () => {
    const bookInfo = await getBookInfo("The Trouble With Harry");
    console.log(bookInfo.items[1].saleInfo);
})()