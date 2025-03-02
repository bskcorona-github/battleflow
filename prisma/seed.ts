import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // MCの初期データを定義
  const mcData = [
    {
      name: "呂布カルマ",
      affiliation: "JET CITY PEOPLE",
      description: "KING OF KINGSで2度の優勝を果たした実力派MC。",
      hood: "愛知県",
    },
    {
      name: "GADORO",
      affiliation: "無所属",
      description: "KING OF KINGSで初の2連覇を達成したMC。",
      hood: "宮崎県",
    },
    {
      name: "FORK",
      affiliation: "ICE BAHN",
      description:
        "ULTIMATE MC BATTLEとKING OF KINGSで優勝経験を持つ二冠王者。",
      hood: "埼玉県",
    },
    {
      name: "崇勲",
      affiliation: "無所属",
      description: "KING OF KINGS初代王者。",
      hood: "埼玉県",
    },
    {
      name: "RAWAXXX",
      affiliation: "無所属",
      description: "KING OF KINGS 2019年の優勝者。",
      hood: "東京都",
    },
    {
      name: "9for",
      affiliation: "無所属",
      description: "KING OF KINGS 2024年の優勝者。",
      hood: "不明",
    },
    {
      name: "裂固",
      affiliation: "HIKIGANE SOUND",
      description: "KING OF KINGS 2022年の優勝者。",
      hood: "岐阜県",
    },
    {
      name: "MOL53",
      affiliation: "無所属",
      description: "KING OF KINGS 2023年の優勝者。",
      hood: "北海道",
    },
    {
      name: "SAM",
      affiliation: "無所属",
      description: "戦極MC BATTLEで初の3連覇を達成したMC。",
      hood: "栃木",
    },
    {
      name: "MU-TON",
      affiliation: "無所属",
      description: "戦極MC BATTLEで2連覇、初の4度優勝を果たしたMC。",
      hood: "福島県",
    },

    {
      name: "ID",
      affiliation: "Kuragaly Production",
      description:
        "USのラップを日本語で再現するフロウが特徴的なMC。戦極MC BATTLE第19章で優勝経験を持つ。",
      hood: "高知県",
    },
    {
      name: "JUMBO MAATCH",
      affiliation: "BEAN BALL RECORDS、MJR RECORDS",
      description:
        "日本のレゲエ界の重鎮であり、フリースタイルダンジョンの3代目モンスターとしても活躍。",
      hood: "大阪府",
    },
    {
      name: "CHEHON",
      affiliation: "無所属",
      description:
        "レゲエDeejayとして知られ、MCバトルにも積極的に参戦。戦極MC BATTLEや凱旋MC BATTLEなどで活躍。",
      hood: "大阪府",
    },
    {
      name: "POWER WAVE",
      affiliation: "無所属",
      description:
        "レゲエDeejayでありながら、MCバトルでも活躍。渋谷レゲエ祭 vs 真ADRENALINE #4で優勝経験を持つ。",
      hood: "不明",
    },
    {
      name: "T-Pablow",
      affiliation: "BAD HOP",
      description:
        "高校生RAP選手権での優勝を皮切りに、フリースタイルダンジョンの初代モンスターとしても活躍。",
      hood: "神奈川県",
    },
    {
      name: "晋平太",
      affiliation: "無所属",
      description:
        "史上初のUMB（ULTIMATE MC BATTLE）2連覇を達成し、フリースタイルダンジョン完全制覇など、圧倒的な実績を持つMC。即興で韻を踏みながら相手にアンサーするスタイルが特徴。",
      hood: "埼玉県狭山市",
    },
    {
      name: "がーどまん",
      affiliation: "無所属",
      description:
        "ドッキリ系YouTuber「チャンネルがーどまん」として人気を集める一方、KING OF KINGS 2018西日本予選を優勝するなど、バトルMCとしての実力も本物。",
      hood: "大阪府",
    },
    {
      name: "Red Eye",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、その鋭いリリックとパフォーマンスで注目を集めるMC。",
      hood: "不明",
    },
    {
      name: "Novel Core",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、独自のスタイルとリリックで観客を魅了する若手MC。",
      hood: "不明",
    },
    {
      name: "OZworld",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、独特の世界観とフロウで知られるMC。",
      hood: "不明",
    },
    {
      name: "Leon Fanourakis",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、エネルギッシュなパフォーマンスで注目を集めるMC。",
      hood: "不明",
    },
    {
      name: "D.O",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、その独特なキャラクターとリリックで知られるベテランMC。",
      hood: "不明",
    },
    {
      name: "孫GONG",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、力強いラップと存在感で観客を魅了するMC。",
      hood: "不明",
    },
    {
      name: "漢 a.k.a. GAMI",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、日本のヒップホップシーンを代表するベテランMC。",
      hood: "不明",
    },
    {
      name: "紅桜",
      affiliation: "無所属",
      description:
        "BATTLE SUMMIT Ⅱなどの大会に出場し、その独特なスタイルとリリックで注目を集めるMC。",
      hood: "不明",
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
