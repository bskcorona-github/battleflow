import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ... 残りのコードは変更なし ...
async function main() {
  // MCの初期データを定義
  const mcData = [
    {
      name: "R-指定",
      affiliation: "Creepy Nuts",
      description:
        "Creepy Nutsのメンバー。フリースタイルダンジョンでの活躍で知られる。UMB3連覇王者",
      style: "フリースタイル、パンチライン",
      hood: "大阪",
    },
    {
      name: "呂布カルマ",
      affiliation: "JET CITY PEOPLE",
      description: "名古屋を拠点に活動する実力派MC。",
      style: "リリカル、アグレッシブ",
      hood: "名古屋",
    },
    {
      name: "崇勲",
      affiliation: "HOME MADE 家族",
      description: "ユーモアと鋭いリリックで知られるMC。",
      style: "ユーモア、パンチライン",
      hood: "埼玉",
    },
    {
      name: "般若",
      affiliation: "昭和レコード",
      description: "日本のヒップホップシーンを代表するMC。",
      style: "アグレッシブ、ストリート",
      hood: "東京",
    },
    {
      name: "輪入道",
      affiliation: "Libra Records",
      description: "独特なフロウとキャラクターで人気のMC。",
      style: "ユニーク、アグレッシブ",
      hood: "千葉",
    },
    {
      name: "FORK",
      affiliation: "ICE BAHN",
      description: "独特なパンチラインとフロウが特徴のMC。",
      style: "パンチライン",
      hood: "神奈川",
    },
    {
      name: "SIMON JAP",
      affiliation: "MSC",
      description: "テクニカルなスキルとパンチラインで知られるMC。",
      style: "テクニカル、パンチライン",
      hood: "東京",
    },
    {
      name: "GADORO",
      affiliation: "",
      description: "独特な世界観とリリックで人気のMC。",
      style: "リリカル",
      hood: "宮崎",
    },
    {
      name: "焔信太郎",
      affiliation: "",
      description: "アグレッシブなバトルスタイルが特徴のMC。",
      style: "アグレッシブ",
      hood: "東京",
    },
    {
      name: "DOTAMA",
      affiliation: "術ノ穴",
      description: "高速ラップとテクニカルなスキルで知られるMC。",
      style: "テクニカル、スピード",
      hood: "栃木",
    },
    {
      name: "KZ",
      affiliation: "ICE BAHN",
      description: "パンチラインとフロウの技術が高いMC。",
      style: "テクニカル、パンチライン",
      hood: "神奈川",
    },
    {
      name: "SPARK",
      affiliation: "",
      description: "アグレッシブなバトルスタイルのMC。",
      style: "アグレッシブ",
      hood: "東京",
    },
    {
      name: "ACE",
      affiliation: "",
      description: "テクニカルなスキルとパンチラインが特徴のMC。",
      style: "テクニカル、パンチライン",
      hood: "東京",
    },
    {
      name: "NAIKA MC",
      affiliation: "",
      description: "独特なキャラクターとフロウで人気のMC。",
      style: "ユニーク",
      hood: "東京",
    },
    {
      name: "CHICO CARLITO",
      affiliation: "",
      description: "パンチラインとフロウの技術が高いMC。",
      style: "パンチライン",
      hood: "沖縄",
    },
    {
      name: "SAM",
      affiliation: "",
      description: "アグレッシブなバトルスタイルが特徴のMC。",
      style: "アグレッシブ",
      hood: "東京",
    },
    {
      name: "SILENT KILLA JOINT",
      affiliation: "",
      description: "テクニカルなスキルとパンチラインで知られるMC。",
      style: "テクニカル、パンチライン",
      hood: "東京",
    },
    {
      name: "NIJYU",
      affiliation: "",
      description: "独特なフロウとリリックが特徴のMC。",
      style: "ユニーク、リリカル",
      hood: "東京",
    },
    {
      name: "KOPERU",
      affiliation: "",
      description: "パンチラインとテクニカルなスキルが特徴のMC。",
      style: "テクニカル、パンチライン",
      hood: "大阪",
    },
  ];

  // 既存のデータを削除
  await prisma.mC.deleteMany();

  // MCデータを一括挿入
  for (const mc of mcData) {
    await prisma.mC.create({
      data: mc,
    });
  }

  console.log("MCデータを登録しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
