export const authUsers = [
  { username: 'admin', password: '0000', role: 'ADMIN', name: 'Quản trị hệ thống' },
  { username: 'nguyenchibao', password: '1234', role: 'QS', name: 'Nguyễn Chí Bảo' },
  { username: 'thanhthao', password: '1234', role: 'QS', name: 'Thanh Thảo' },
  { username: 'duongxuanvu', password: '1234', role: 'GIÁM ĐỐC', name: 'Dương Xuân Vũ' },
];

export const findAuthUser = (username, password) =>
  authUsers.find(
    (user) => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password,
  ) || null;
