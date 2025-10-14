import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760417961699 implements MigrationInterface {
    name = 'InitialSchema1760417961699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tag" character varying(100), "chain" character varying(50) NOT NULL, "address" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f907d5fd09a9d374f1da4e13bd3" UNIQUE ("address"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_92558c08091598f7a4439586cd" ON "wallets" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d6a57812d5b7afed14f776ecb" ON "wallets" ("chain") `);
        await queryRunner.query(`CREATE INDEX "IDX_f907d5fd09a9d374f1da4e13bd" ON "wallets" ("address") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f907d5fd09a9d374f1da4e13bd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d6a57812d5b7afed14f776ecb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92558c08091598f7a4439586cd"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
    }

}
