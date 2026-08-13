export const initialUsers = [
  {
    id: 'u-1',
    name: 'Quản trị hệ thống',
    username: '@admin',
    phone: '0901 000 000',
    role: 'ADMIN',
    status: 'Active',
    lastLogin: '08:58:27 8/8/2026',
    ipLogin: '1.54.25.78',
    ipHistory: ['1.54.25.78', '171.234.111.243', '1.54.25.7X'],
    signature: null,
    allowViewFinancials: true
  },
  {
    id: 'u-2',
    name: 'Nguyễn Chí Bảo',
    username: '@nguyenchibao',
    phone: '0912 345 678',
    role: 'QS',
    status: 'Active',
    lastLogin: '12:26:42 11/7/2026',
    ipLogin: 'chưa khóa',
    ipHistory: [],
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 20 Q 30 5, 50 20 T 90 20" stroke="%233b82f6" fill="none" stroke-width="2"/></svg>',
    allowViewFinancials: true
  },
  {
    id: 'u-3',
    name: 'Thanh Thảo',
    username: '@thanhthao',
    phone: '0932893950',
    role: 'QS',
    status: 'Active',
    lastLogin: '10:59:38 6/8/2026',
    ipLogin: 'chưa khóa',
    ipHistory: ['1.54.25.78'],
    signature: null,
    allowViewFinancials: true
  },
  {
    id: 'u-4',
    name: 'Dương Xuân Vũ',
    username: '@duongxuanvu',
    phone: '0903 112 233',
    role: 'GIÁM ĐỐC',
    status: 'Active',
    lastLogin: 'Offline',
    ipLogin: 'chưa khóa',
    ipHistory: [],
    signature: null,
    allowViewFinancials: true
  },
  {
    id: 'u-5',
    name: 'Thu Ngọc',
    username: '@thungoc',
    phone: '0977 123 999',
    role: 'THƯ KÝ',
    status: 'Active',
    lastLogin: '10:10:30 6/8/2026',
    ipLogin: 'chưa khóa',
    ipHistory: ['1.54.25.78'],
    signature: null,
    allowViewFinancials: false
  },
  {
    id: 'u-6',
    name: 'Mỹ Hảo',
    username: '@myhao',
    phone: '0988 555 444',
    role: 'KẾ TOÁN VẬT TƯ',
    status: 'Active',
    lastLogin: '08:37:50 10/8/2026',
    ipLogin: 'chưa khóa',
    ipHistory: ['1.54.25.78'],
    signature: null,
    allowViewFinancials: true
  },
  {
    id: 'u-7',
    name: 'Nguyễn Nghi',
    username: '@nguyennghi',
    phone: '0933 777 888',
    role: 'KẾ TOÁN THUẾ',
    status: 'Active',
    lastLogin: '16:08:34 25/6/2026',
    ipLogin: 'chưa khóa',
    ipHistory: [],
    signature: null,
    allowViewFinancials: true
  },
  {
    id: 'u-8',
    name: 'Phương Lan',
    username: '@phuonglan',
    phone: '0918 222 333',
    role: 'KẾ TOÁN CHI PHÍ',
    status: 'Active',
    lastLogin: '08:38:01 10/8/2026',
    ipLogin: 'chưa khóa',
    ipHistory: ['1.54.25.78'],
    signature: null,
    allowViewFinancials: true
  },
  {
    id: 'u-9',
    name: 'Huỳnh Văn Trung',
    username: '@huynhvantrung',
    phone: '0365811644',
    role: 'CHT',
    status: 'Active',
    lastLogin: '14:20:34 7/8/2026',
    ipLogin: 'chưa khóa',
    ipHistory: ['14.227.188.204', '27.78.248.52', '203.210.231.12'],
    signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30"><path d="M 5 25 L 30 5 L 50 25 L 75 10" stroke="%2310b981" fill="none" stroke-width="2"/></svg>',
    allowViewFinancials: false
  },
  {
    id: 'u-10',
    name: 'Lê Trang Thái Dương',
    username: '@thaiduong',
    phone: '0379455279',
    role: 'CHT',
    status: 'Active',
    lastLogin: '10:46:07 8/8/2026',
    ipLogin: 'chưa khóa',
    ipHistory: ['113.185.75.12', '113.185.80.91'],
    signature: null,
    allowViewFinancials: false
  }
];

export const standardBlocksTemplate = [
  {
    blockName: 'BLOCK A',
    groups: [
      { groupName: 'CĂN HỘ', items: ['BẢ LỚP 1', 'BẢ LỚP 2', 'XẢ NHÁM', 'SƠN LÓT', 'SƠN PHỦ 01', 'SƠN PHỦ 2'] },
      { groupName: 'HÀNH LANG', items: ['BẢ LỚP 1', 'BẢ LỚP 2', 'XẢ NHÁM', 'SƠN LÓT', 'SƠN PHỦ 1', 'SƠN PHỦ 2'] }
    ]
  },
  {
    blockName: 'BLOCK B',
    groups: [
      { groupName: 'CĂN HỘ', items: ['BẢ LỚP 1', 'BẢ LỚP 2', 'XẢ NHÁM', 'SƠN LÓT', 'SƠN PHỦ 1', 'SƠN PHỦ 2'] },
      { groupName: 'HÀNH LANG', items: ['BẢ LỚP 1', 'BẢ LỚP 2', 'XẢ NHÁM', 'SƠN LÓT', 'SƠN PHỦ 1', 'SƠN PHỦ 2'] }
    ]
  }
];

const buildEmptyItems = (blocks) => {
  const items = {};
  blocks.forEach((block) => {
    block.groups.forEach((group) => {
      group.items.forEach((item) => {
        items[`${block.blockName}_${group.groupName}_${item}`] = '';
      });
    });
  });
  return items;
};

const buildFloorRows = (blocks, floors) =>
  floors.map(({ floor, numApts, sampleItems = {} }) => ({
    floor,
    numApts,
    items: { ...buildEmptyItems(blocks), ...sampleItems }
  }));

const sunhomeFloors = buildFloorRows(standardBlocksTemplate, [
  {
    floor: 'Tầng 12',
    numApts: '12',
    sampleItems: {
      'BLOCK A_CĂN HỘ_BẢ LỚP 1': 'ĐỢT 1 (6 căn) (Tổ Sơn Nước Minh Phát)',
      'BLOCK A_CĂN HỘ_BẢ LỚP 2': 'ĐỢT 1 (6 căn) (Tổ Sơn Nước Minh Phát)'
    }
  },
  { floor: 'Tầng 11', numApts: '12' },
  { floor: 'Tầng 10', numApts: '12', sampleItems: { 'BLOCK A_CĂN HỘ_BẢ LỚP 1': 'Xong 100%' } },
  { floor: 'Tầng 9', numApts: '12' },
  { floor: 'Tầng 8', numApts: '12' }
]);

export const initialProjects = [
  {
    id: 'p-7',
    name: 'SUNHOME',
    orderType: 'TRỰC TIẾP ORDER',
    subContractorInfo: 'Sun Group / PCC',
    address: 'PHÚ QUỐC, KIÊN GIANG',
    contractNo: '232/2025/HĐ/PCC-QTPK',
    contractDate: '2025-03-15',
    cht: ['Huỳnh Văn Trung'],
    gs: 'Lê Trang Thái Dương',
    numBlocks: '2',
    contractValue: 8500000000,
    addendumValue: 500000000,
    advancePayment: 800000000,
    status: 'Doing',
    progress: 45
  },
  {
    id: 'p-1',
    name: 'MINI HOTEL ỐP LÁT',
    orderType: 'CHỦ ĐẦU TƯ GIAO',
    subContractorInfo: 'Chủ đầu tư Mini Hotel PQ',
    address: 'PHÚ QUỐC',
    contractNo: '145/2025/HĐ/HT-PQ',
    contractDate: '2025-01-20',
    cht: ['Lê Trang Thái Dương'],
    gs: 'Nguyễn Chí Bảo',
    numBlocks: '1',
    contractValue: 3200000000,
    addendumValue: 0,
    advancePayment: 300000000,
    status: 'Doing',
    progress: 35
  },
  {
    id: 'p-8',
    name: 'CARA RIVER PARK',
    orderType: 'TỔNG THẦU MUA HỘ',
    subContractorInfo: 'Cara Land',
    address: 'CẦN THƠ',
    contractNo: '89/2025/HĐ/CARA-QSS',
    contractDate: '2025-04-10',
    cht: ['Huỳnh Văn Trung'],
    gs: 'Thanh Thảo',
    numBlocks: '2',
    contractValue: 5600000000,
    addendumValue: 200000000,
    advancePayment: 500000000,
    status: 'Doing',
    progress: 28
  },
  {
    id: 'p-9',
    name: 'EATON PARK PHASE I',
    orderType: 'TRỰC TIẾP ORDER',
    subContractorInfo: 'Mapletree / Frasers',
    address: 'TP. HỒ CHÍ MINH',
    contractNo: '312/2025/HĐ/EP-QSS',
    contractDate: '2025-05-01',
    cht: ['Huỳnh Văn Trung'],
    gs: 'Nguyễn Chí Bảo',
    numBlocks: '2',
    contractValue: 7200000000,
    addendumValue: 0,
    advancePayment: 700000000,
    status: 'Doing',
    progress: 22
  },
  {
    id: 'p-2',
    name: 'BCONS TĐH',
    orderType: 'TRỰC TIẾP ORDER',
    subContractorInfo: 'Bcons Group',
    address: 'BÌNH DƯƠNG',
    contractNo: '78/2025/HĐ/BCONS-QSS',
    contractDate: '2025-02-15',
    cht: ['Huỳnh Văn Trung'],
    gs: 'Thanh Thảo',
    numBlocks: '2',
    contractValue: 4100000000,
    addendumValue: 100000000,
    advancePayment: 400000000,
    status: 'Doing',
    progress: 55
  },
  {
    id: 'p-3',
    name: 'PICITY SKY PARK',
    orderType: 'TRỰC TIẾP ORDER',
    subContractorInfo: 'Pi Group',
    address: 'BÌNH DƯƠNG',
    contractNo: '156/2025/HĐ/PIC-QSS',
    contractDate: '2025-06-01',
    cht: ['Lê Trang Thái Dương'],
    gs: 'Nguyễn Chí Bảo',
    numBlocks: '2',
    contractValue: 6800000000,
    addendumValue: 0,
    advancePayment: 600000000,
    status: 'Doing',
    progress: 18
  }
];

export const initialTeams = [
  {
    id: 't-1',
    projectId: 'p-7', // SUNHOME
    projectName: 'SUNHOME',
    teamName: 'Tổ Sơn Nước Minh Phát',
    leaderName: 'Trần Minh Phát',
    phone: '0912 345 678',
    tradeType: 'Bả & Sơn Nước Nội/Ngoại thất',
    workerCount: 18,
    contractValue: 1250000000,
    paidAmount: 890000000,
    retentionAmount: 62500000,
    remainingAmount: 297500000,
    status: 'Đang thi công',
    members: [
      { id: 'm-1', name: 'Trần Minh Phát', cccd: '079092123456', birthYear: 1992, safetyCardExpiry: '15/05/2027', photo: 'https://i.pravatar.cc/150?u=TMP', pdf: 'HoSo_TMP.pdf' },
      { id: 'm-2', name: 'Nguyễn Văn An', cccd: '079098765432', birthYear: 1995, safetyCardExpiry: '20/08/2026', photo: 'https://i.pravatar.cc/150?u=NVA', pdf: 'HoSo_NVA.pdf' }
    ]
  },
  {
    id: 't-2',
    projectId: 'p-1', // MINI HOTEL ỐP LÁT
    projectName: 'MINI HOTEL ỐP LÁT',
    teamName: 'Tổ Xây Tô Anh Hùng',
    leaderName: 'Nguyễn Văn Hùng',
    phone: '0988 123 456',
    tradeType: 'Xây gạch & Tô trát tường',
    workerCount: 22,
    contractValue: 850000000,
    paidAmount: 520000000,
    retentionAmount: 42500000,
    remainingAmount: 287500000,
    status: 'Đang thi công',
    members: [
      { id: 'm-3', name: 'Nguyễn Văn Hùng', cccd: '048085111222', birthYear: 1985, safetyCardExpiry: '10/12/2026', photo: 'https://i.pravatar.cc/150?u=NVH', pdf: 'HoSo_NVH.pdf' }
    ]
  },
  {
    id: 't-3',
    projectId: 'p-8', // CARA RIVER PARK
    projectName: 'CARA RIVER PARK',
    teamName: 'Tổ Thạch Cao Hoàng Nam',
    leaderName: 'Lê Hoàng Nam',
    phone: '0903 555 777',
    tradeType: 'Trần & Vách Thạch Cao',
    workerCount: 15,
    contractValue: 1600000000,
    paidAmount: 950000000,
    retentionAmount: 80000000,
    remainingAmount: 570000000,
    status: 'Đang thi công',
    members: []
  },
  {
    id: 't-4',
    projectId: 'p-1', // MINI HOTEL
    projectName: 'MINI HOTEL ỐP LÁT',
    teamName: 'Tổ Ốp Lát Phú Quốc',
    leaderName: 'Phạm Văn Tài',
    phone: '0977 888 999',
    tradeType: 'Ốp Lát Gạch & Đá Granit',
    workerCount: 14,
    contractValue: 920000000,
    paidAmount: 610000000,
    retentionAmount: 46000000,
    remainingAmount: 264000000,
    status: 'Đang thi công',
    members: []
  },
  {
    id: 't-5',
    projectId: 'p-9', // EATON PARK
    projectName: 'EATON PARK PHASE I',
    teamName: 'Tổ Điện Nước Tiến Đạt',
    leaderName: 'Ngô Tiến Đạt',
    phone: '0934 111 222',
    tradeType: 'Hệ thống M&E & Cấp thoát nước',
    workerCount: 25,
    contractValue: 2100000000,
    paidAmount: 1300000000,
    retentionAmount: 105000000,
    remainingAmount: 695000000,
    status: 'Đang thi công',
    members: []
  }
];

export const initialIPCs = [
  {
    id: 'ipc-ab-1',
    type: 'A-B', // CĐT nghiệm thu & trả tiền cho Tổng Thầu / QS
    projectId: 'p-7',
    projectName: 'SUNHOME',
    period: 'Đợt 01',
    submitDate: '2026-05-10',
    approvalDate: '2026-05-15',
    proposedAmount: 1500000000,
    approvedAmount: 1487999639,
    advanceDeduction: 200000000,
    retentionRate: 5, // %
    retentionAmount: 74399982,
    netPayable: 1213599657,
    status: 'Đã giải ngân',
    notes: 'Đã nhận đủ tiền đợt 1 chuyển khoản từ Sun Group'
  },
  {
    id: 'ipc-ab-2',
    type: 'A-B',
    projectId: 'p-7',
    projectName: 'SUNHOME',
    period: 'Đợt 02',
    submitDate: '2026-07-28',
    approvalDate: '2026-08-01',
    proposedAmount: 1200000000,
    approvedAmount: 1150000000,
    advanceDeduction: 150000000,
    retentionRate: 5,
    retentionAmount: 57500000,
    netPayable: 942500000,
    status: 'Đang chờ duyệt',
    notes: 'QS đã trình hồ sơ nghiệm thu tầng 5-10'
  },
  {
    id: 'ipc-ab-3',
    type: 'A-B',
    projectId: 'p-1',
    projectName: 'MINI HOTEL ỐP LÁT',
    period: 'Đợt 01',
    submitDate: '2026-06-05',
    approvalDate: '2026-06-10',
    proposedAmount: 800000000,
    approvedAmount: 800000000,
    advanceDeduction: 100000000,
    retentionRate: 5,
    retentionAmount: 40000000,
    netPayable: 660000000,
    status: 'Đã giải ngân',
    notes: 'Hoàn tất nghiệm thu phần ốp lát tầng 1-3'
  },
  {
    id: 'ipc-bc-1',
    type: 'B-C', // QS duyệt trả tiền cho Tổ Đội
    projectId: 'p-7',
    projectName: 'SUNHOME',
    teamId: 't-1',
    teamName: 'Tổ Sơn Nước Minh Phát',
    period: 'Đợt 03',
    submitDate: '2026-07-20',
    approvalDate: '2026-07-25',
    proposedAmount: 180000000,
    approvedAmount: 175000000,
    advanceDeduction: 10000000,
    retentionRate: 5,
    retentionAmount: 8750000,
    netPayable: 156250000,
    status: 'Đã thanh toán',
    notes: 'Thanh toán đợt bả + sơn lót tháp B tầng 3-10'
  },
  {
    id: 'ipc-bc-2',
    type: 'B-C',
    projectId: 'p-1',
    projectName: 'MINI HOTEL ỐP LÁT',
    teamId: 't-2',
    teamName: 'Tổ Xây Tô Anh Hùng',
    period: 'Đợt 02',
    submitDate: '2026-08-02',
    approvalDate: '2026-08-05',
    proposedAmount: 120000000,
    approvedAmount: 120000000,
    advanceDeduction: 0,
    retentionRate: 5,
    retentionAmount: 6000000,
    netPayable: 114000000,
    status: 'Trình Kế Toán',
    notes: 'Đã CHT xác nhận khối lượng thực tế'
  }
];

export const initialMaterials = [
  {
    id: 'm-1',
    projectId: 'p-7',
    projectName: 'SUNHOME',
    code: 'VT-XM-01',
    name: 'Xi măng INSEE Multimax (Bao 50kg)',
    unit: 'Bao',
    unitPrice: 92000,
    quantityPlan: 5000,
    quantityActual: 4850,
    supplier: 'CTY Xi Măng Miền Nam',
    status: 'Bình thường'
  },
  {
    id: 'm-2',
    projectId: 'p-1',
    projectName: 'MINI HOTEL ỐP LÁT',
    code: 'VT-SN-02',
    name: 'Sơn Lót Nội Thất Dulux Interior Primer (18L)',
    unit: 'Thùng',
    unitPrice: 1450000,
    quantityPlan: 350,
    quantityActual: 365,
    supplier: 'Đại Lý Dulux Thành Phát',
    status: 'Vượt định mức'
  },
  {
    id: 'm-3',
    projectId: 'p-7',
    projectName: 'SUNHOME',
    code: 'VT-SN-03',
    name: 'Sơn Phủ Ngoại Thất Dulux Weathershield (18L)',
    unit: 'Thùng',
    unitPrice: 2350000,
    quantityPlan: 400,
    quantityActual: 380,
    supplier: 'Đại Lý Dulux Thành Phát',
    status: 'Bình thường'
  },
  {
    id: 'm-4',
    projectId: 'p-8',
    projectName: 'CARA RIVER PARK',
    code: 'VT-TC-04',
    name: 'Tấm Thạch Cao Vĩnh Tường Bo Mặt 9mm',
    unit: 'Tấm',
    unitPrice: 1650000,
    quantityPlan: 2200,
    quantityActual: 2150,
    supplier: 'Công ty Vĩnh Tường',
    status: 'Bình thường'
  },
  {
    id: 'm-5',
    projectId: 'p-9',
    projectName: 'EATON PARK PHASE I',
    code: 'VT-TP-05',
    name: 'Thép Cuộn Pomina D10',
    unit: 'Tấn',
    unitPrice: 16800000,
    quantityPlan: 85,
    quantityActual: 84.5,
    supplier: 'Tập đoàn Thép Pomina',
    status: 'Bình thường'
  }
];

export const initialPaymentMatrix = {
  SUNHOME: sunhomeFloors,
  SUNHOME_team: JSON.parse(JSON.stringify(sunhomeFloors)),
  SUNHOME_ipc: sunhomeFloors.map((row) => ({
    floor: row.floor,
    numApts: row.numApts,
    items: {
      'BLOCK A_CĂN HỘ_BẢ LỚP 1': row.floor === 'Tầng 10' ? 'IPC 01 (12 căn)' : ''
    }
  })),
  'BCONS TĐH': buildFloorRows(standardBlocksTemplate, [
    { floor: 'Tầng 5', numApts: '10' },
    { floor: 'Tầng 4', numApts: '10' },
    { floor: 'Tầng 3', numApts: '10' }
  ]),
  'EATON PARK PHASE I': buildFloorRows(standardBlocksTemplate, [
    { floor: 'Tầng 6', numApts: '8' },
    { floor: 'Tầng 5', numApts: '8' }
  ]),
  'PICITY SKY PARK': buildFloorRows(standardBlocksTemplate, [
    { floor: 'Tầng 3', numApts: '6' }
  ])
};

export const defaultMatrixBlocks = {
  SUNHOME: standardBlocksTemplate,
  'BCONS TĐH': standardBlocksTemplate,
  'EATON PARK PHASE I': standardBlocksTemplate,
  'PICITY SKY PARK': standardBlocksTemplate,
  'MINI HOTEL ỐP LÁT': standardBlocksTemplate,
  'CARA RIVER PARK': standardBlocksTemplate
};