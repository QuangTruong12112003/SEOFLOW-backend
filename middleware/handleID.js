const handleID = (type) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `0${now.getMonth() + 1}`.slice(-2);
  const date = `0${now.getDate()}`.slice(-2);
  const hours = `0${now.getHours()}`.slice(-2);
  const minutes = `0${now.getMinutes()}`.slice(-2);
  const seconds = `0${now.getSeconds()}`.slice(-2);
  const milliseconds = `00${now.getMilliseconds()}`.slice(-3);
  const random = Math.floor(Math.random() * 1000); // 000–999
  const suffix = `000${random}`.slice(-3);

  return `${type}${year}${month}${date}${hours}${minutes}${seconds}${milliseconds}${suffix}`;
};

module.exports = handleID;
