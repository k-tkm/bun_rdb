import * as fs from "fs";
import * as path from "path";

interface TableSchema {
  [key: string]: "string" | "number" | "boolean";
}

class Table {
  private data: Record<string, any>[] = [];

  constructor(
    private schema: TableSchema,
    initialData?: Record<string, any>[]
  ) {
    if (initialData) {
      this.data = initialData;
    }
  }

  private validateRecord(
    record: Record<string, any>,
    forUpdate: boolean = false
  ): void {
    for (const key in this.schema) {
      const expectedType = this.schema[key];
      const value = record[key];

      if (!forUpdate || value !== undefined) {
        if (typeof value !== expectedType) {
          throw new Error(
            `Type mismatch for '${key}': expected ${expectedType}, got ${typeof value}`
          );
        }
      }
    }
  }
  public insert(record: Record<string, any>): void {
    // スキーマに従っているかの検証
    // ...
    this.validateRecord(record);

    this.data.push(record);
  }

  public getData(): Record<string, any>[] {
    return this.data;
  }

  // レコードを取得する
  public get(
    predicate: (record: Record<string, any>) => boolean
  ): Record<string, any>[] {
    return this.data.filter(predicate);
  }

  // レコードを更新する
  public update(
    predicate: (record: Record<string, any>) => boolean,
    newValues: Partial<Record<string, any>>
  ): void {
    this.validateRecord(newValues, true);

    this.data.forEach((record) => {
      if (predicate(record)) {
        Object.assign(record, newValues);
      }
    });
  }

  // レコードを削除する
  public delete(predicate: (record: Record<string, any>) => boolean): void {
    this.data = this.data.filter((record) => !predicate(record));
  }
  // ...
}

class Database {
  private tables: Record<string, Table> = {};
  private dbFilePath: string;

  constructor(dbFilePath: string) {
    this.dbFilePath = dbFilePath;
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.dbFilePath)) {
      const content = fs.readFileSync(this.dbFilePath, "utf8");
      const jsonData = JSON.parse(content);

      for (const tableName in jsonData) {
        const tableData = jsonData[tableName];
        this.tables[tableName] = new Table({}, tableData);
      }
    }
  }

  public save(): void {
    const dataToSave: Record<string, any[]> = {};
    for (const tableName in this.tables) {
      dataToSave[tableName] = this.tables[tableName].getData();
    }

    fs.writeFileSync(
      this.dbFilePath,
      JSON.stringify(dataToSave, null, 2),
      "utf8"
    );
  }

  public createTable(tableName: string, schema: TableSchema): void {
    if (this.tables[tableName]) {
      throw new Error(`Table "${tableName}" already exists.`);
    }

    this.tables[tableName] = new Table(schema);
    this.save();
  }

  public getTable(tableName: string): Table {
    const table = this.tables[tableName];
    if (!table) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    return table;
  }

  public dropTable(tableName: string): void {
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" does not exist.`);
    }

    delete this.tables[tableName];
    this.save();
  }
}

// 使用例
const db = new Database("mydatabase.json");
db.createTable("users", {
  id: "number",
  name: "string",
  isActive: "boolean",
});

const usersTable = db.getTable("users");
usersTable.insert({ id: 1, name: "Alice", isActive: true });
db.save();
