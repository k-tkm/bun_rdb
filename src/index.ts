import * as fs from "fs";
import * as path from "path";
import { SQLCommand, SQLCommandType, SQLParser } from "./sqlParser";

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
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const content = fs.readFileSync(this.dbFilePath, "utf8");
        const jsonData = JSON.parse(content);

        for (const tableName in jsonData) {
          const tableData = jsonData[tableName];
          this.tables[tableName] = new Table({}, tableData);
        }
      }
    } catch (error) {
      throw new Error(`Failed to load database: ${error}`);
    }
  }

  public save(): void {
    try {
      const dataToSave: Record<string, any[]> = {};
      for (const tableName in this.tables) {
        dataToSave[tableName] = this.tables[tableName].getData();
      }

      fs.writeFileSync(
        this.dbFilePath,
        JSON.stringify(dataToSave, null, 2),
        "utf8"
      );
    } catch (error) {
      throw new Error(`Failed to save database: ${error}`);
    }
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

  public executeSQL(query: string): any {
    const command = SQLParser.parse(query);

    switch (command.type) {
      case SQLCommandType.SELECT:
        return this.executeSelect(command);
      case SQLCommandType.INSERT:
        return this.executeInsert(command);
      // 他のコマンドの実行ロジックもここに追加
      default:
        throw new Error(`Unsupported SQL command: ${command.type}`);
    }
  }

  private executeSelect(command: SQLCommand): any {
    const table = this.getTable(command.tableName);
    return table.get((record) => {
      if (command.fields) {
        return command.fields.some((field) => field in record);
      }
      return true;
    });
  }

  private executeInsert(command: SQLCommand): void {
    const table = this.getTable(command.tableName);
    table.insert(command.values!);
    this.save();
  }
}

// 使用例
const db = new Database("mydatabase.json");
// db.createTable("users2", {
//   id: "number",
//   name: "string",
//   isActive: "boolean",
// });

db.executeSQL(
  'INSERT INTO users (id, name, isActive) VALUES (1, "Alice", true)'
);
const result = db.executeSQL("SELECT * FROM users");
console.log(result);
