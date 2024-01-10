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

  // データを追加または更新する
  public insertOrUpdate(key: string, value: any): void {
    this.data[key] = value;
    this.save();
  }

  // 指定されたキーに対応するデータを削除する
  public delete(key: string): void {
    delete this.data[key];
    this.save();
  }

  // データベースの内容を全て取得する
  public getAll(): Record<string, any> {
    return this.data;
  }

  public find(predicate: (value: any, key: string) => boolean): any[] {
    return Object.keys(this.data)
      .filter((key) => predicate(this.data[key], key))
      .map((key) => this.data[key]);
  }
}

const db = new Database("mydatabase.json");
db.insertOrUpdate("user3", { name: "Charlie", age: 35 });
console.log(db.find((user) => user.age > 25));
