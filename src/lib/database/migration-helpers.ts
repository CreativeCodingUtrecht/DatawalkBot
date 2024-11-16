import { sql } from "kysely"
import type { CreateTableBuilder } from "kysely"

export const addStandardColumns = <T extends string, C extends string = never>(
    builder: CreateTableBuilder<T, C>
  ) => {
    return builder
      .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      // .addColumn('updated_at', 'timestamp', (col) =>
      //   col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      // )
  }