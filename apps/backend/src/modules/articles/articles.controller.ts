import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { ArticlesService } from "./articles.service";
import { CreateArticleCategoryDto } from "./dto/create-article-category.dto";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

@Controller("api/v1/admin")
@UseGuards(JwtAuthGuard)
export class AdminArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get("articles")
  listArticles(@CurrentUser() user: AuthTokenPayload) {
    return this.articlesService.listArticles(user.roles);
  }

  @Get("articles/:id")
  getArticle(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.articlesService.getArticle(user.roles, id);
  }

  @Post("articles")
  @HttpCode(HttpStatus.CREATED)
  createArticle(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateArticleDto,
  ) {
    return this.articlesService.createArticle(user.roles, body);
  }

  @Patch("articles/:id")
  updateArticle(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: UpdateArticleDto,
  ) {
    return this.articlesService.updateArticle(user.roles, id, body);
  }

  @Delete("articles/:id")
  deleteArticle(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ) {
    return this.articlesService.deleteArticle(user.roles, id);
  }

  @Get("article-categories")
  listCategories(@CurrentUser() user: AuthTokenPayload) {
    return this.articlesService.listCategories(user.roles);
  }

  @Post("article-categories")
  @HttpCode(HttpStatus.CREATED)
  createCategory(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateArticleCategoryDto,
  ) {
    return this.articlesService.createCategory(user.roles, body);
  }
}
