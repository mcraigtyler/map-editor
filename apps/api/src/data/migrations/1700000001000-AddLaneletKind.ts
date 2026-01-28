import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaneletKind1700000001000 implements MigrationInterface {
  name = 'AddLaneletKind1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE features DROP CONSTRAINT IF EXISTS features_kind_check`
    );
    await queryRunner.query(
      `ALTER TABLE features ADD CONSTRAINT features_kind_check CHECK (kind IN ('point','line','polygon','road','lanelet'))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE features DROP CONSTRAINT IF EXISTS features_kind_check`
    );
    await queryRunner.query(
      `ALTER TABLE features ADD CONSTRAINT features_kind_check CHECK (kind IN ('point','line','polygon','road'))`
    );
  }
}
