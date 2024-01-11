export enum SQLCommandType {
  SELECT,
  INSERT,
}

export interface SQLCommand {
  type: SQLCommandType;
  tableName: string;
  fields?: string[];
  values?: Record<string, any>;
}

export class SQLParser {
  public static parse(query: string): SQLCommand {
    // ここでは非常に基本的なパース処理を行います
    // 実際には、もっと複雑なパースロジックが必要です
    const tokens = query.split(/\s+/);
    const commandType = tokens[0].toUpperCase();

    switch (commandType) {
      case "SELECT":
        return {
          type: SQLCommandType.SELECT,
          tableName: tokens[3], // "SELECT * FROM table_name"
          fields: tokens[1] !== "*" ? tokens[1].split(",") : undefined,
        };
      case "INSERT":
        // "INSERT INTO table_name (field1, field2) VALUES (value1, value2)"
        // のような形式を想定しています
        // ...
        return {
          type: SQLCommandType.INSERT,
          tableName: tokens[2],
          values: {
            /* ... */
          },
        };
      // 他のコマンドのパースロジックもここに追加
      default:
        throw new Error(`Unsupported SQL command: ${commandType}`);
    }
  }
}
