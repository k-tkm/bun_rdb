import * as fs from "fs";
import * as path from "path";

// データベースを表すクラス
class Database {
  private data: Record<string, any>;
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
    this.data = this.load();
  }

  // データベースからデータを読み込む
  private load(): Record<string, any> {
    try {
      const content = fs.readFileSync(
        path.resolve(__dirname, this.filename),
        "utf8"
      );
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  // データをデータベースに保存する
  private save(): void {
    const content = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(path.resolve(__dirname, this.filename), content, "utf8");
  }

  // データを取得する
  public get(key: string): any {
    return this.data[key];
  }

  // データを設定する
  public set(key: string, value: any): void {
    this.data[key] = value;
    this.save();
  }
}

// 使用例
const db = new Database("mydatabase.json");
db.set("user1", { name: "Alice", age: 25 });
console.log(db.get("user1"));
