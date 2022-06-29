export class User {
  constructor(
    firstName,
    lastName,
    gender,
    email,
    password,
    birthday,
    telephone,
    country,
    bio,
    favoriteNumber,
    favoriteColor,
    avatarImagePath,
    agreementLevel,
    getsNewsletter
  ) {
    this._firstName = firstName;
    this._lastName = lastName;
    this._gender = gender;
    this._email = email;
    this._password = password;
    this._birthday = birthday;
    this._telephone = telephone;
    this._country = country;
    this._bio = bio;
    this._favoriteNumber = favoriteNumber;
    this._favoriteColor = favoriteColor;
    this._avatarImagePath = avatarImagePath;
    this._agreementLevel = agreementLevel;
    this._getsNewsletter = getsNewsletter;
    this.createdAt = new Date().toLocaleString();
  }
}
